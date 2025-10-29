import React, { useState, useRef } from 'react';
import { Bug, Upload, AlertTriangle, CheckCircle, X, Image as ImageIcon } from 'lucide-react';

const PestDetection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockResult = {
        pest: 'Aphids',
        confidence: 92,
        severity: 'High',
        description: 'Small, soft-bodied insects that feed on plant sap',
        treatment: [
          'Apply insecticidal soap spray',
          'Introduce beneficial insects (ladybugs)',
          'Use neem oil treatment',
          'Remove heavily infested leaves'
        ],
        prevention: [
          'Regular plant inspection',
          'Maintain plant health',
          'Avoid over-fertilization',
          'Use companion planting'
        ]
      };
      setResult(mockResult);
      setIsAnalyzing(false);
    }, 3000);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bug className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pest Detection</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Upload an image to identify pests and get treatment recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Upload Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload Pest Image</h2>
            
            {!preview ? (
              <div
                className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-orange-400 dark:hover:border-orange-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  PNG, JPG, JPEG up to 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={preview}
                  alt="Pest preview"
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Identify Pest'}
                </button>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Analysis Results</h2>
            
            {isAnalyzing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Analyzing pest...</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                {/* Pest Info */}
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">Detected Pest</h3>
                  </div>
                  <p className="text-lg font-bold text-orange-800 dark:text-orange-200">{result.pest}</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">{result.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-orange-700 dark:text-orange-300">
                      Confidence: {result.confidence}%
                    </span>
                    <span className="text-sm text-orange-700 dark:text-orange-300">
                      Severity: {result.severity}
                    </span>
                  </div>
                </div>

                {/* Treatment */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Recommended Treatment</h4>
                  <ul className="space-y-2">
                    {result.treatment.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Prevention */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Prevention Tips</h4>
                  <ul className="space-y-2">
                    {result.prevention.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Upload an image to see pest identification results</p>
              </div>
            )}
          </div>
        </div>

        {/* Pest Library */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Common Pests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Aphids', description: 'Small sap-sucking insects', severity: 'High' },
              { name: 'Whiteflies', description: 'Tiny white flying insects', severity: 'Moderate' },
              { name: 'Spider Mites', description: 'Microscopic web-spinning pests', severity: 'High' },
              { name: 'Thrips', description: 'Slender insects with fringed wings', severity: 'Moderate' }
            ].map((pest, index) => (
              <div key={index} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{pest.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    pest.severity === 'High' ? 'bg-red-100 text-red-800' :
                    pest.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {pest.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{pest.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PestDetection;


