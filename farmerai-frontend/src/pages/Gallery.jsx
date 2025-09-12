import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import HomeButton from '../components/HomeButton';
import { glass } from '../styles/globalStyles';

// Placeholder data for gallery items
const galleryItems = [
  { id: 1, src: "/public/farm.jpg", title: "Soil Testing", description: "AI-powered soil analysis for optimal crop growth.", alt: "Soil being tested" },
  { id: 2, src: "/public/image.png", title: "Healthy Crops", description: "Vibrant crops thriving with FarmerAI recommendations.", alt: "Healthy crops in a field" },
  { id: 3, src: "", title: "Community Event", description: "Farmers gathering at a local FarmerAI workshop.", alt: "Farmers at a community event" },
  { id: 4, src: "https://via.placeholder.com/600x400/33FF57/FFFFFF?text=Tutorial+Image+1", title: "Planting Tutorial", description: "Step-by-step guide on efficient planting techniques.", alt: "Hands planting a seedling" },
  { id: 5, src: "https://via.placeholder.com/600x400/3357FF/FFFFFF?text=Crop+Variety+1", title: "New Crop Variety", description: "Introducing a drought-resistant crop for arid regions.", alt: "New crop variety" },
  { id: 6, src: "https://via.placeholder.com/600x400/FF33A1/FFFFFF?text=Soil+Type+2", title: "Clay Soil", description: "Understanding the properties of clay soil for better management.", alt: "Close-up of clay soil" },
  { id: 7, src: "https://via.placeholder.com/600x400/A1FF33/FFFFFF?text=Event+Highlight+2", title: "Harvest Festival", description: "Celebrating a bountiful harvest with the FarmerAI community.", alt: "Harvest festival celebration" },
  { id: 8, src: "https://via.placeholder.com/600x400/33A1FF/FFFFFF?text=Tutorial+Image+2", title: "Irrigation Setup", description: "Setting up an automated irrigation system.", alt: "Irrigation system in a field" },
];

// GalleryCard Component
const GalleryCard = ({ item, onClick }) => {
  return (
    <motion.div
      className={`${glass.card} relative group cursor-pointer overflow-hidden rounded-xl`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      onClick={() => onClick(item)}
    >
      <img
        src={item.src}
        alt={item.alt}
        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-white text-center"
        >
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="text-sm">View</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ImageModal Component
const ImageModal = ({ item, onClose, onNext, onPrev }) => {
  if (!item) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose} // Close when clicking outside the image
    >
      <motion.div
        className="relative bg-gray-800 p-4 rounded-lg shadow-xl max-w-3xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-2xl p-2 rounded-full bg-gray-700 hover:bg-gray-600 z-10"
          aria-label="Close image modal"
        >
          &times;
        </button>
        <img src={item.src} alt={item.alt} className="max-w-full max-h-[70vh] object-contain mx-auto rounded-md" />
        <div className="text-center mt-4">
          <h3 className="text-xl font-semibold text-white">{item.title}</h3>
          {item.description && <p className="text-gray-300 text-sm mt-1">{item.description}</p>}
        </div>
        <div className="absolute inset-y-0 left-0 flex items-center">
          <button
            onClick={onPrev}
            className="bg-gray-700 bg-opacity-75 text-white p-3 rounded-r-lg hover:bg-opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            &lt;
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            onClick={onNext}
            className="bg-gray-700 bg-opacity-75 text-white p-3 rounded-l-lg hover:bg-opacity-100 transition-opacity"
            aria-label="Next image"
          >
            &gt;
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const openModal = (item) => {
    setSelectedImage(item);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const goToNext = () => {
    const currentIndex = galleryItems.findIndex(item => item.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % galleryItems.length;
    setSelectedImage(galleryItems[nextIndex]);
  };

  const goToPrev = () => {
    const currentIndex = galleryItems.findIndex(item => item.id === selectedImage.id);
    const prevIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    setSelectedImage(galleryItems[prevIndex]);
  };

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImage) {
        if (e.key === 'Escape') {
          closeModal();
        } else if (e.key === 'ArrowRight') {
          goToNext();
        } else if (e.key === 'ArrowLeft') {
          goToPrev();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImage]);

  return (
    <motion.div
      className="bg-gray-50 min-h-screen text-gray-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <HomeButton />
      {/* Hero Section */}
      <header className="relative bg-green-600 text-white text-center py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-30 z-0"></div> {/* Glass overlay effect */}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold">Gallery</h1>
          <p className="text-xl mt-4">Explore farming snapshots, tutorials, and event highlights</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {galleryItems.map((item) => (
            <GalleryCard key={item.id} item={item} onClick={openModal} />
          ))}
        </div>
      </main>

      {selectedImage && (
        <ImageModal
          item={selectedImage}
          onClose={closeModal}
          onNext={goToNext}
          onPrev={goToPrev}
        />
      )}
    </motion.div>
  );
};

export default Gallery;