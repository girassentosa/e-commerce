'use client';

import { useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  images: Array<{ imageUrl: string; altText?: string }>;
  onChange: (images: Array<{ imageUrl: string; altText?: string }>) => void;
  maxImages?: number;
}

export function ImageUploader({ images, onChange, maxImages = 5 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image`);
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 5MB)`);
        }

        // Upload to API
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        return {
          imageUrl: data.data.url,
          altText: file.name.replace(/\.[^/.]+$/, ''),
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      onChange([...images, ...uploadedImages]);
      toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    // Validate URL format
    try {
      new URL(urlInput.trim());
    } catch {
      toast.error('Invalid URL format');
      return;
    }

    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);

    try {
      // Upload URL to API
      const formData = new FormData();
      formData.append('url', urlInput.trim());

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image from URL');
      }

      onChange([
        ...images,
        {
          imageUrl: data.data.url,
          altText: 'Uploaded from URL',
        },
      ]);

      toast.success('Image uploaded successfully from URL');
      setUrlInput('');
    } catch (error: any) {
      console.error('Error uploading image from URL:', error);
      toast.error(error.message || 'Failed to upload image from URL');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (index: number) => {
    const imageToRemove = images[index];
    const newImages = images.filter((_, i) => i !== index);
    
    // Delete file from server (both temporary and saved images)
    // Check if imageUrl starts with /images/ (local upload)
    if (imageToRemove.imageUrl && imageToRemove.imageUrl.startsWith('/images/')) {
      try {
        // Call API to delete the file
        const response = await fetch('/api/admin/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: imageToRemove.imageUrl }),
        });
        
        if (response.ok) {
          console.log('✅ [ImageUploader] Deleted image:', imageToRemove.imageUrl);
        } else {
          console.warn('⚠️ [ImageUploader] Failed to delete image:', imageToRemove.imageUrl);
        }
      } catch (error) {
        console.error('⚠️ [ImageUploader] Error deleting image:', imageToRemove.imageUrl, error);
        // Don't block removal from UI even if file deletion fails
      }
    }
    
    // Update images list (remove from UI)
    onChange(newImages);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Mode Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setUploadMode('file')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            uploadMode === 'file'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('url')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            uploadMode === 'url'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <LinkIcon className="w-4 h-4 inline mr-2" />
          From URL
        </button>
      </div>

      {/* Upload Area */}
      {uploadMode === 'file' ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={uploading || images.length >= maxImages}
          />

          <label
            htmlFor="image-upload"
            className={`cursor-pointer ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? (
              <Loader2 className="w-12 h-12 mx-auto text-gray-400 animate-spin mb-3" />
            ) : (
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            )}
            <p className="text-gray-700 font-medium mb-1">
              {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-gray-500">
              PNG, JPG, JPEG, GIF, WEBP up to 5MB (max {maxImages} images)
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {images.length} / {maxImages} images uploaded
            </p>
          </label>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="image-url" className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                id="image-url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                disabled={uploading || images.length >= maxImages}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !uploading && urlInput.trim()) {
                    handleUrlUpload();
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste image URL from gallery, Google Images, or any website
              </p>
            </div>
            <Button
              type="button"
              onClick={handleUrlUpload}
              disabled={uploading || images.length >= maxImages || !urlInput.trim()}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Upload from URL
                </>
              )}
            </Button>
            <p className="text-xs text-gray-400 text-center">
              {images.length} / {maxImages} images uploaded
            </p>
          </div>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
            >
              <Image
                src={image.imageUrl}
                alt={image.altText || `Product image ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

