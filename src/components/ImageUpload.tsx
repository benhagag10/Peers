import { useState, useCallback, useRef } from 'react';
import { Upload, X, Link, Image } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function ImageUpload({ value, onChange, className = '' }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError('');

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Validate file size (max 2MB for base64 storage)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  }, [urlInput, onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  // If there's already an image, show preview
  if (value) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 bg-white/5">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={() => setError('Failed to load image')}
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Drag & drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-white/20 hover:border-white/30 hover:bg-white/5'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <div className={`p-2 rounded-xl ${isDragging ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
            {isDragging ? (
              <Image className="w-5 h-5 text-indigo-400" />
            ) : (
              <Upload className="w-5 h-5 text-white/40" />
            )}
          </div>
          <div className="text-sm">
            <span className={isDragging ? 'text-indigo-400' : 'text-white/60'}>
              {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
            </span>
          </div>
          <p className="text-xs text-white/30">PNG, JPG up to 2MB</p>
        </div>
      </div>

      {/* URL input toggle */}
      {!showUrlInput ? (
        <button
          type="button"
          onClick={() => setShowUrlInput(true)}
          className="mt-2 flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          <Link className="w-3 h-3" />
          Or enter image URL
        </button>
      ) : (
        <div className="mt-2 flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="flex-1 px-2.5 py-1.5 text-sm text-white placeholder-white/30
              bg-white/5 border border-white/10 rounded-lg
              focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-2.5 py-1.5 text-xs text-white bg-indigo-500 rounded-lg hover:bg-indigo-400 transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="px-2.5 py-1.5 text-xs text-white/60 bg-white/5 border border-white/10 rounded-lg
              hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default ImageUpload;
