document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadBtn = document.getElementById('uploadBtn');
    const imageInput = document.getElementById('imageInput');
    const emptyState = document.getElementById('emptyState');
    const emptyStateUploadBtn = document.getElementById('emptyStateUploadBtn');
    const imageEditor = document.getElementById('imageEditor');
    const editorControls = document.getElementById('editorControls');
    const previewImage = document.getElementById('previewImage');
    const cropOverlay = document.getElementById('cropOverlay');
    const cropBtn = document.getElementById('cropBtn');
    const resetBtn = document.getElementById('resetBtn');
    const saveBtn = document.getElementById('saveBtn');
    const aspectRatioBtns = document.querySelectorAll('.aspect-ratio-btn');
    const galleryContainer = document.getElementById('galleryContainer');
    const galleryGrid = document.getElementById('galleryGrid');
    const emptyGallery = document.getElementById('emptyGallery');
    const clearGalleryBtn = document.getElementById('clearGalleryBtn');
    
    // Modals
    const previewModal = document.getElementById('previewModal');
    const modalPreviewImage = document.getElementById('modalPreviewImage');
    const closePreviewModal = document.getElementById('closePreviewModal');
    const closePreviewBtn = document.getElementById('closePreviewBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    const helpModal = document.getElementById('helpModal');
    const helpBtn = document.getElementById('helpBtn');
    const closeHelpModal = document.getElementById('closeHelpModal');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    
    const confirmModal = document.getElementById('confirmModal');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const closeConfirmModal = document.getElementById('closeConfirmModal');
    const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    
    // State management
    let originalImage = null;
    let currentImage = null;
    let cropArea = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let resizing = null;
    let currentAspectRatio = 'free';
    let savedImages = loadFromLocalStorage('savedImages') || [];
    let selectedImageIndex = null;
    
    // Theme management
    let currentTheme = loadFromLocalStorage('theme') || 'light';
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    const settingsContainer = document.getElementById('settingsContainer');
    
    // Navigation toggle for mobile
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    
    navToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
    });
    
    // Close mobile menu when clicking a nav link
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
    
    // Sidebar menu functionality
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sidebarLinks.forEach(item => {
                item.parentElement.classList.remove('active');
            });
            link.parentElement.classList.add('active');
            
            const viewName = link.getAttribute('data-view');
            if (viewName === 'editor') {
                galleryContainer.style.display = 'none';
                settingsContainer.style.display = 'none';
                imageEditor.style.display = originalImage ? 'block' : 'none';
                editorControls.style.display = originalImage ? 'block' : 'none';
                emptyState.style.display = originalImage ? 'none' : 'block';
            } else if (viewName === 'gallery') {
                galleryContainer.style.display = 'block';
                settingsContainer.style.display = 'none';
                imageEditor.style.display = 'none';
                editorControls.style.display = 'none';
                emptyState.style.display = 'none';
                renderGallery();
            } else if (viewName === 'settings') {
                galleryContainer.style.display = 'none';
                settingsContainer.style.display = 'block';
                imageEditor.style.display = 'none';
                editorControls.style.display = 'none';
                emptyState.style.display = 'none';
            }
        });
    });
    
    // Upload image event handlers
    uploadBtn.addEventListener('click', () => {
        imageInput.click();
    });
    
    emptyStateUploadBtn.addEventListener('click', () => {
        imageInput.click();
    });
    
    imageInput.addEventListener('change', handleImageUpload);
    
    // Image editing event handlers
    resetBtn.addEventListener('click', resetCrop);
    cropBtn.addEventListener('click', cropImage);
    saveBtn.addEventListener('click', saveToGallery);
    
    aspectRatioBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            aspectRatioBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentAspectRatio = btn.getAttribute('data-ratio');
            updateCropOverlayWithAspectRatio();
        });
    });
    
    // Set free aspect ratio as default
    document.querySelector('[data-ratio="free"]').classList.add('active');
    
    // Crop overlay drag and resize events
    cropOverlay.addEventListener('mousedown', startDragOrResize);
    cropOverlay.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    // Gallery event handlers
    clearGalleryBtn.addEventListener('click', () => {
        showConfirmModal(
            'Clear Gallery', 
            'Are you sure you want to delete all saved images? This action cannot be undone.', 
            clearGallery
        );
    });
    
    // Modal event handlers
    closePreviewModal.addEventListener('click', () => {
        previewModal.classList.remove('active');
    });
    
    closePreviewBtn.addEventListener('click', () => {
        previewModal.classList.remove('active');
    });
    
    helpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        helpModal.classList.add('active');
    });
    
    closeHelpModal.addEventListener('click', () => {
        helpModal.classList.remove('active');
    });
    
    closeHelpBtn.addEventListener('click', () => {
        helpModal.classList.remove('active');
    });
    
    closeConfirmModal.addEventListener('click', () => {
        confirmModal.classList.remove('active');
    });
    
    cancelConfirmBtn.addEventListener('click', () => {
        confirmModal.classList.remove('active');
    });
    
    // Initialize gallery on load
    renderGallery();
    
    // Initialize theme
    initializeTheme();
    
    // Theme toggle event
    themeToggle.addEventListener('click', toggleTheme);
    
    // Functions
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    originalImage = img;
                    
                    // Reset the input to allow selecting the same file again
                    imageInput.value = '';
                    
                    // Show the editor
                    emptyState.style.display = 'none';
                    imageEditor.style.display = 'block';
                    editorControls.style.display = 'block';
                    
                    // Set the preview image
                    previewImage.src = img.src;
                    previewImage.style.maxWidth = '100%';
                    previewImage.style.maxHeight = '400px';
                    
                    // Initialize crop overlay
                    initCropOverlay();
                };
                
                img.src = event.target.result;
            };
            
            reader.readAsDataURL(file);
            showToast('success', 'Image Uploaded', 'Your image has been uploaded successfully');
        } else {
            showToast('error', 'Invalid File', 'Please select a valid image file');
        }
    }
    
    function initCropOverlay() {
        // Set the crop overlay size based on the image dimensions
        const imgRect = previewImage.getBoundingClientRect();
        const imgWidth = imgRect.width;
        const imgHeight = imgRect.height;
        
        // Set crop overlay to 80% of the image size
        const overlayWidth = imgWidth * 0.8;
        const overlayHeight = imgHeight * 0.8;
        
        cropOverlay.style.width = `${overlayWidth}px`;
        cropOverlay.style.height = `${overlayHeight}px`;
        
        // Calculate crop area coordinates relative to the image
        cropArea = {
            x: (imgWidth - overlayWidth) / 2,
            y: (imgHeight - overlayHeight) / 2,
            width: overlayWidth,
            height: overlayHeight
        };
    }
    
    function startDragOrResize(e) {
        e.preventDefault();
        const target = e.target;
        
        // Check if we're resizing or dragging
        if (target.classList.contains('crop-handle')) {
            resizing = target.classList[1]; // top-left, top-right, etc.
        } else {
            isDragging = true;
        }
        
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        
        document.addEventListener('mousemove', moveOrResize);
        document.addEventListener('mouseup', stopDragOrResize);
    }
    
    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const target = e.target;
        
        // Check if we're resizing or dragging
        if (target.classList.contains('crop-handle')) {
            resizing = target.classList[1]; // top-left, top-right, etc.
        } else {
            isDragging = true;
        }
        
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const moveX = touch.clientX - dragStartX;
        const moveY = touch.clientY - dragStartY;
        
        handleMove(moveX, moveY);
        
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
    }
    
    function handleTouchEnd() {
        isDragging = false;
        resizing = null;
        
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    }
    
    function moveOrResize(e) {
        const moveX = e.clientX - dragStartX;
        const moveY = e.clientY - dragStartY;
        
        handleMove(moveX, moveY);
        
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    }
    
    function handleMove(moveX, moveY) {
        const imgRect = previewImage.getBoundingClientRect();
        const overlayRect = cropOverlay.getBoundingClientRect();
        
        if (isDragging) {
            // Move the crop overlay
            cropArea.x += moveX;
            cropArea.y += moveY;
            
            // Prevent moving outside the image
            cropArea.x = Math.max(0, Math.min(cropArea.x, imgRect.width - overlayRect.width));
            cropArea.y = Math.max(0, Math.min(cropArea.y, imgRect.height - overlayRect.height));
            
            // Update the position
            cropOverlay.style.top = `${cropArea.y}px`;
            cropOverlay.style.left = `${cropArea.x}px`;
            cropOverlay.style.transform = 'none';
            
        } else if (resizing) {
            // Resize the crop overlay
            let newWidth = cropArea.width;
            let newHeight = cropArea.height;
            let newX = cropArea.x;
            let newY = cropArea.y;
            
            // Handle different resize handles
            if (resizing === 'top-left') {
                newWidth = cropArea.width - moveX;
                newHeight = cropArea.height - moveY;
                newX = cropArea.x + moveX;
                newY = cropArea.y + moveY;
            } else if (resizing === 'top-right') {
                newWidth = cropArea.width + moveX;
                newHeight = cropArea.height - moveY;
                newY = cropArea.y + moveY;
            } else if (resizing === 'bottom-left') {
                newWidth = cropArea.width - moveX;
                newHeight = cropArea.height + moveY;
                newX = cropArea.x + moveX;
            } else if (resizing === 'bottom-right') {
                newWidth = cropArea.width + moveX;
                newHeight = cropArea.height + moveY;
            }
            
            // Enforce minimum size
            newWidth = Math.max(50, newWidth);
            newHeight = Math.max(50, newHeight);
            
            // Enforce aspect ratio if selected
            if (currentAspectRatio !== 'free') {
                const ratio = parseAspectRatio(currentAspectRatio);
                
                if (resizing.includes('right')) {
                    newHeight = newWidth / ratio;
                } else {
                    newWidth = newHeight * ratio;
                }
            }
            
            // Make sure crop area stays within the image
            if (newX < 0) {
                newX = 0;
                if (resizing.includes('left')) {
                    newWidth = cropArea.x + cropArea.width;
                }
            }
            
            if (newY < 0) {
                newY = 0;
                if (resizing.includes('top')) {
                    newHeight = cropArea.y + cropArea.height;
                }
            }
            
            if (newX + newWidth > imgRect.width) {
                if (resizing.includes('right')) {
                    newWidth = imgRect.width - newX;
                } else {
                    newX = imgRect.width - newWidth;
                }
            }
            
            if (newY + newHeight > imgRect.height) {
                if (resizing.includes('bottom')) {
                    newHeight = imgRect.height - newY;
                } else {
                    newY = imgRect.height - newHeight;
                }
            }
            
            // Update crop area
            cropArea.x = newX;
            cropArea.y = newY;
            cropArea.width = newWidth;
            cropArea.height = newHeight;
            
            // Update the overlay
            cropOverlay.style.top = `${cropArea.y}px`;
            cropOverlay.style.left = `${cropArea.x}px`;
            cropOverlay.style.width = `${cropArea.width}px`;
            cropOverlay.style.height = `${cropArea.height}px`;
            cropOverlay.style.transform = 'none';
        }
    }
    
    function stopDragOrResize() {
        isDragging = false;
        resizing = null;
        
        document.removeEventListener('mousemove', moveOrResize);
        document.removeEventListener('mouseup', stopDragOrResize);
    }
    
    function parseAspectRatio(ratio) {
        if (ratio === 'free') return null;
        
        const parts = ratio.split(':');
        return parseFloat(parts[0]) / parseFloat(parts[1]);
    }
    
    function updateCropOverlayWithAspectRatio() {
        if (!originalImage) return;
        
        const imgRect = previewImage.getBoundingClientRect();
        const ratio = parseAspectRatio(currentAspectRatio);
        
        if (!ratio) return; // Free aspect ratio, no changes needed
        
        // Calculate new height based on current width and aspect ratio
        const newHeight = cropArea.width / ratio;
        
        // Check if the new height fits within the image
        if (cropArea.y + newHeight > imgRect.height) {
            // If not, adjust width instead
            const newWidth = cropArea.height * ratio;
            cropArea.width = newWidth;
        } else {
            cropArea.height = newHeight;
        }
        
        // Update the overlay
        cropOverlay.style.width = `${cropArea.width}px`;
        cropOverlay.style.height = `${cropArea.height}px`;
    }
    
    function resetCrop() {
        if (!originalImage) return;
        
        // Reset to original image
        previewImage.src = originalImage.src;
        
        // Reset crop overlay
        initCropOverlay();
        
        showToast('info', 'Reset', 'Crop has been reset');
    }
    
    function cropImage() {
        if (!originalImage) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Get the scaling factor between original image and displayed image
        const displayedWidth = previewImage.width;
        const displayedHeight = previewImage.height;
        const scaleX = originalImage.naturalWidth / displayedWidth;
        const scaleY = originalImage.naturalHeight / displayedHeight;
        
        // Set canvas dimensions to the crop area size
        canvas.width = cropArea.width * scaleX;
        canvas.height = cropArea.height * scaleY;
        
        // Draw the cropped portion of the image onto the canvas
        ctx.drawImage(
            originalImage,
            cropArea.x * scaleX,
            cropArea.y * scaleY,
            cropArea.width * scaleX,
            cropArea.height * scaleY,
            0, 0,
            canvas.width,
            canvas.height
        );
        
        // Convert canvas to image
        const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // Update the preview
        previewImage.src = croppedImageUrl;
        
        // Create a new Image object with the cropped image
        const croppedImg = new Image();
        croppedImg.src = croppedImageUrl;
        croppedImg.onload = function() {
            originalImage = croppedImg;
            
            // Reset the crop overlay to fit the new image
            initCropOverlay();
            
            showToast('success', 'Image Cropped', 'Your image has been cropped successfully');
        };
    }
    
    function saveToGallery() {
        if (!originalImage) return;
        
        // Convert current image to data URL
        const canvas = document.createElement('canvas');
        canvas.width = originalImage.naturalWidth;
        canvas.height = originalImage.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(originalImage, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // Create a new saved image object
        const newImage = {
            id: Date.now(),
            dataUrl: imageDataUrl,
            date: new Date().toISOString(),
            width: originalImage.naturalWidth,
            height: originalImage.naturalHeight
        };
        
        // Add to saved images array
        savedImages.unshift(newImage);
        
        // Save to localStorage
        saveToLocalStorage('savedImages', savedImages);
        
        // Show success message
        showToast('success', 'Image Saved', 'Your image has been saved to the gallery');
        
        // If in gallery view, update the gallery
        if (galleryContainer.style.display === 'block') {
            renderGallery();
        }
    }
    
    function renderGallery() {
        galleryGrid.innerHTML = '';
        
        if (savedImages.length === 0) {
            galleryGrid.style.display = 'none';
            emptyGallery.style.display = 'block';
            return;
        }
        
        galleryGrid.style.display = 'grid';
        emptyGallery.style.display = 'none';
        
        savedImages.forEach((image, index) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            
            const formattedDate = formatDate(new Date(image.date));
            const dimensions = `${image.width} × ${image.height}`;
            
            galleryItem.innerHTML = `
                <img src="${image.dataUrl}" alt="Saved image" class="gallery-image">
                <div class="gallery-info">
                    <div class="gallery-dimensions">${dimensions}</div>
                    <div class="gallery-date">${formattedDate}</div>
                </div>
                <div class="gallery-actions">
                    <button class="gallery-action-btn view" data-index="${index}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="gallery-action-btn delete" data-index="${index}">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            `;
            
            galleryGrid.appendChild(galleryItem);
        });
        
        // Add event listeners to gallery item buttons
        document.querySelectorAll('.gallery-action-btn.view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.getAttribute('data-index'));
                openPreviewModal(index);
            });
        });
        
        document.querySelectorAll('.gallery-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.getAttribute('data-index'));
                
                showConfirmModal(
                    'Delete Image', 
                    'Are you sure you want to delete this image?', 
                    () => deleteImage(index)
                );
            });
        });
        
        // Make whole gallery item clickable to view image
        document.querySelectorAll('.gallery-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                openPreviewModal(index);
            });
        });
    }
    
    function openPreviewModal(index) {
        if (index < 0 || index >= savedImages.length) return;
        
        selectedImageIndex = index;
        const image = savedImages[index];
        
        modalPreviewImage.src = image.dataUrl;
        downloadBtn.href = image.dataUrl;
        downloadBtn.download = `cropped-image-${formatDateForFilename(new Date(image.date))}.jpg`;
        
        previewModal.classList.add('active');
    }
    
    function deleteImage(index) {
        if (index < 0 || index >= savedImages.length) return;
        
        savedImages.splice(index, 1);
        saveToLocalStorage('savedImages', savedImages);
        renderGallery();
        
        showToast('success', 'Image Deleted', 'The image has been deleted from your gallery');
    }
    
    function clearGallery() {
        savedImages = [];
        saveToLocalStorage('savedImages', savedImages);
        renderGallery();
        
        showToast('success', 'Gallery Cleared', 'All images have been removed from your gallery');
    }
    
    function showConfirmModal(title, message, confirmCallback) {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        
        // Remove any existing event listener
        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        confirmBtn = document.getElementById('confirmBtn');
        
        // Add new event listener
        confirmBtn.addEventListener('click', () => {
            confirmCallback();
            confirmModal.classList.remove('active');
        });
        
        confirmModal.classList.add('active');
    }
    
    // Helper functions
    function formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    function formatDateForFilename(date) {
        return date.toISOString().split('T')[0];
    }
    
    function saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            showToast('error', 'Storage Error', 'Could not save to local storage');
        }
    }
    
    function loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            showToast('error', 'Storage Error', 'Could not load from local storage');
            return null;
        }
    }
    
    // Toast notification system
    function showToast(type, title, message) {
        const toastContainer = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon;
        switch (type) {
            case 'success':
                icon = 'fa-check-circle';
                break;
            case 'error':
                icon = 'fa-exclamation-circle';
                break;
            case 'warning':
                icon = 'fa-exclamation-triangle';
                break;
            default:
                icon = 'fa-info-circle';
        }
        
        toast.innerHTML = `
            <i class="fas ${icon} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Remove toast after animation completes
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    // Theme management functions
    function initializeTheme() {
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeUI();
    }
    
    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        saveToLocalStorage('theme', currentTheme);
        updateThemeUI();
        showToast('success', 'Tema Alterado', `Tema ${currentTheme === 'light' ? 'claro' : 'escuro'} ativado`);
    }
    
    function updateThemeUI() {
        if (currentTheme === 'dark') {
            themeIcon.className = 'fas fa-moon';
            themeText.textContent = 'Tema Escuro';
        } else {
            themeIcon.className = 'fas fa-sun';
            themeText.textContent = 'Tema Claro';
        }
    }
});
