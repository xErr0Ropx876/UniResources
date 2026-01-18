'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Folder, FileText, Eye as EyeIcon, Eye, Star, Trash2, AlertTriangle, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface FolderData {
    _id: string
    name: string
    type: string
    icon: string
    parentFolder?: string
    resourceCount?: number
    subfolderCount?: number
}

interface ResourceData {
    _id: string
    title: string
    description: string
    fileUrl: string
    thumbnailUrl?: string
    tags: string[]
    views: number
    enrollments: number
    featured: boolean
    uploadedBy: { name: string }
}

interface Breadcrumb {
    name: string
    id: string | null
}

function ResourcesPageContent() {
    const searchParams = useSearchParams()
    const folderId = searchParams.get('folder')

    const { data: session } = useSession()
    const [folders, setFolders] = useState<FolderData[]>([])
    const [resources, setResources] = useState<ResourceData[]>([])
    const [currentFolder, setCurrentFolder] = useState<any>(null)
    const [breadcrumbPath, setBreadcrumbPath] = useState<Breadcrumb[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'folder' | 'resource', id: string, name: string } | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [folderId])

    const buildBreadcrumbs = async (folder: any): Promise<Breadcrumb[]> => {
        const crumbs: Breadcrumb[] = []

        // Recursively fetch parent folders to build breadcrumb
        let currentFolderId = folder.parentFolder
        const fetchedFolders: any[] = []

        while (currentFolderId) {
            try {
                const response = await fetch(`/api/folders/${currentFolderId}`)
                const result = await response.json()

                if (result.success) {
                    fetchedFolders.unshift(result.data) // Add to beginning
                    currentFolderId = result.data.parentFolder
                } else {
                    break
                }
            } catch (error) {
                console.error('Error fetching parent folder:', error)
                break
            }
        }

        // Build breadcrumb array from fetched parents
        for (const f of fetchedFolders) {
            crumbs.push({ name: f.name, id: f._id })
        }

        // Add current folder
        crumbs.push({ name: folder.name, id: folder._id })

        return crumbs
    }

    const fetchData = async () => {
        try {
            setIsLoading(true)

            if (folderId) {
                // Fetch specific folder contents
                const response = await fetch(`/api/folders/${folderId}`)
                const result = await response.json()

                if (result.success) {
                    setCurrentFolder(result.data)
                    setFolders(result.data.subfolders || [])
                    setResources(result.data.resources || [])

                    // Build clickable breadcrumbs
                    const crumbs = await buildBreadcrumbs(result.data)
                    setBreadcrumbPath(crumbs)
                }
            } else {
                // Fetch root level (semesters)
                const response = await fetch('/api/folders?parent=null')
                const result = await response.json()

                if (result.success) {
                    setFolders(result.data)
                    setResources([])
                    setCurrentFolder(null)
                    setBreadcrumbPath([])
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteClick = (e: React.MouseEvent, type: 'folder' | 'resource', id: string, name: string) => {
        e.preventDefault()
        e.stopPropagation()
        setDeleteTarget({ type, id, name })
        setShowDeleteConfirm(true)
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return

        setDeleting(true)
        try {
            const endpoint = deleteTarget.type === 'folder'
                ? `/api/folders/${deleteTarget.id}`
                : `/api/resources/${deleteTarget.id}`

            const response = await fetch(endpoint, { method: 'DELETE' })
            const result = await response.json()

            if (result.success) {
                await fetchData()
                setShowDeleteConfirm(false)
                setDeleteTarget(null)
                alert(`${deleteTarget.type === 'folder' ? 'Folder' : 'Resource'} deleted successfully!`)
            } else {
                alert('Error deleting: ' + result.error)
            }
        } catch (error) {
            console.error('Error deleting:', error)
            alert('Failed to delete')
        } finally {
            setDeleting(false)
        }
    }

    const getSemesterColor = (semNumber: number) => {
        const colors = [
            'from-blue-500 to-blue-600',      // Sem 1
            'from-indigo-500 to-indigo-600',  // Sem 2
            'from-green-500 to-green-600',    // Sem 3
            'from-teal-500 to-teal-600',      // Sem 4
            'from-orange-500 to-orange-600',  // Sem 5
            'from-red-500 to-red-600',        // Sem 6
            'from-purple-500 to-purple-600',  // Sem 7
            'from-pink-500 to-pink-600',      // Sem 8
        ]
        return colors[semNumber - 1] || 'from-gray-500 to-gray-600'
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full"></div>
            </div>
        )
    }

    // Root view - Show semesters
    if (!folderId) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-12 text-center">
                        <h1 className="text-5xl font-bold text-primary mb-4">Browse Resources</h1>
                        <p className="text-xl text-gray-600">Select your semester to explore educational materials</p>
                    </div>

                    {/* Semester Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {folders.map((folder, index) => {
                            const semNumber = parseInt(folder.name.replace('Sem ', ''))
                            return (
                                <Link
                                    key={folder._id}
                                    href={`/resources?folder=${folder._id}`}
                                    className="group"
                                >
                                    <div className={`relative bg-gradient-to-br ${getSemesterColor(semNumber)} rounded-2xl p-8 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
                                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                                            {folder.icon}
                                        </div>
                                        <h3 className="text-3xl font-bold mb-2">{folder.name}</h3>
                                        <p className="text-white/90 text-lg">
                                            {folder.subfolderCount && folder.subfolderCount > 0 ? `${folder.subfolderCount} folders • ` : ''} {folder.resourceCount || 0} files
                                        </p>
                                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                                            Semester {semNumber}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    // Folder view - Show subfolders and files
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb - Now Fully Clickable */}
                <div className="mb-6 flex items-center flex-wrap gap-2 text-sm">
                    <Link href="/resources" className="text-accent hover:underline font-medium transition-colors">
                        Home
                    </Link>
                    {breadcrumbPath.map((crumb, index) => (
                        <span key={index} className="flex items-center space-x-2">
                            <span className="text-gray-400">/</span>
                            {index === breadcrumbPath.length - 1 ? (
                                // Last item (current folder) - not clickable, bold
                                <span className="text-gray-900 font-semibold">{crumb.name}</span>
                            ) : (
                                // Parent folders - clickable
                                <Link
                                    href={`/resources?folder=${crumb.id}`}
                                    className="text-gray-600 hover:text-accent hover:underline transition-colors font-medium"
                                >
                                    {crumb.name}
                                </Link>
                            )}
                        </span>
                    ))}
                </div>

                {/* Back Button */}
                <button
                    onClick={() => window.history.back()}
                    className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-accent transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="text-5xl">{currentFolder?.icon}</div>
                        <div>
                            <h1 className="text-4xl font-bold text-primary">{currentFolder?.name}</h1>
                            <p className="text-gray-600 mt-1">
                                {folders.length} folders • {resources.length} files
                            </p>
                        </div>
                    </div>
                </div>

                {/* Folders */}
                {folders.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                            <Folder className="w-6 h-6" />
                            <span>Folders</span>
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {folders.map((folder) => (
                                <div key={folder._id} className="relative group">
                                    <Link
                                        href={`/resources?folder=${folder._id}`}
                                        className="block"
                                    >
                                        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-200">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-4xl group-hover:scale-110 transition-transform">
                                                    {folder.icon}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 truncate">{folder.name}</h3>
                                                    <p className="text-sm text-gray-500">{folder.resourceCount || 0} files</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                    {session?.user.role === 'tech' && (
                                        <button
                                            onClick={(e) => handleDeleteClick(e, 'folder', folder._id, folder.name)}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all z-10"
                                            title="Delete folder"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Files  */}
                {resources.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                            <FileText className="w-6 h-6" />
                            <span>Files</span>
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {resources.map((resource) => (
                                <div
                                    key={resource._id}
                                    className="relative group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
                                >
                                    {/* Thumbnail */}
                                    <div className="h-48 bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center relative overflow-hidden">
                                        {resource.thumbnailUrl ? (
                                            <img
                                                src={resource.thumbnailUrl}
                                                alt={resource.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <FileText className="w-16 h-16 text-white opacity-50" />
                                        )}
                                        {resource.featured && (
                                            <div className="absolute top-3 right-3 bg-accent text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                                                <Star className="w-3 h-3 fill-current" />
                                                <span>Featured</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                            {resource.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                            {resource.description}
                                        </p>

                                        {/* Tags */}
                                        {resource.tags && resource.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {resource.tags.slice(0, 3).map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Stats */}
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <div className="flex items-center space-x-4">
                                                <span className="flex items-center space-x-1">
                                                    <Eye className="w-4 h-4" />
                                                    <span>{resource.views}</span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <Star className="w-4 h-4" />
                                                    <span>{resource.enrollments}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/resources/${resource._id}`}
                                                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-accent to-red-500 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                                <span>View</span>
                                            </Link>
                                            {session?.user.role === 'tech' && (
                                                <button
                                                    onClick={(e) => handleDeleteClick(e, 'resource', resource._id, resource.title)}
                                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                    title="Delete resource"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {folders.length === 0 && resources.length === 0 && (
                    <div className="text-center py-16">
                        <Folder className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">This folder is empty</h3>
                        <p className="text-gray-600">No files or folders have been added yet.</p>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && deleteTarget && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <span className="font-semibold">"{deleteTarget.name}"</span>?
                                {deleteTarget.type === 'folder' && (
                                    <span className="block mt-2 text-sm text-red-600">
                                        Note: You can only delete empty folders.
                                    </span>
                                )}
                            </p>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false)
                                        setDeleteTarget(null)
                                    }}
                                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    disabled={deleting}
                                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ResourcesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full"></div>
            </div>
        }>
            <ResourcesPageContent />
        </Suspense>
    )
}
