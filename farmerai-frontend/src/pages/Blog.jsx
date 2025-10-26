import React, { useState, useEffect } from 'react';
import { FaLeaf, FaTractor, FaChartLine, FaCloudSun } from 'react-icons/fa';
import HomeButton from '../components/HomeButton';
import apiClient from '../services/apiClient';

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fallback static data
  const fallbackSections = [
    {
      title: 'AI-Powered Crop Recommendations',
      content: 'Artificial Intelligence is revolutionizing crop management by providing farmers with data-driven recommendations for what to plant, when to plant, and how to optimize yields. By analyzing historical weather patterns, soil composition, and market demand, AI algorithms can suggest the most profitable and sustainable crop choices. This technology helps farmers mitigate risks associated with climate change and market volatility. For instance, an AI system might recommend planting a drought-resistant crop variety in a region with a high probability of low rainfall. Furthermore, these systems can provide personalized advice based on the specific conditions of a farm, taking into account factors like soil pH, nutrient levels, and local pest prevalence. This level of precision enables farmers to make more informed decisions, leading to increased productivity and profitability while minimizing environmental impact. The adoption of AI in crop selection is a significant step towards a more resilient and efficient agricultural sector, empowering farmers to thrive in an ever-changing world.',
      image: '/blog1.png',
      src: '/public/blog1.png',
      icon: <FaLeaf className="text-green-500" />,
    },
    {
      title: 'Soil Health Monitoring via Phone Camera',
      content: 'Modern smartphones equipped with advanced cameras and AI capabilities are transforming soil health assessment. Farmers can now capture images of their soil and receive instant analysis regarding nutrient levels, pH balance, and overall soil health. This innovative approach eliminates the need for expensive laboratory tests and provides immediate feedback. The technology works by analyzing soil color, texture, and composition patterns through computer vision algorithms. By comparing captured images with extensive databases of soil samples, the system can identify potential issues such as nutrient deficiencies, pH imbalances, or signs of soil degradation. This real-time monitoring enables farmers to make timely interventions, applying the right fertilizers or soil amendments precisely when needed. The convenience and accessibility of this technology make soil health monitoring more democratic, allowing small-scale farmers to access professional-grade analysis tools. As this technology continues to evolve, it promises to revolutionize how farmers understand and manage their most valuable asset - their soil.',
      image: '/blog2.png',
      src: '/public/blog2.png',
      icon: <FaTractor className="text-blue-500" />,
    },
    {
      title: 'Market Trends and Price Prediction',
      content: 'Understanding market dynamics is crucial for farmers to maximize their profits and make informed decisions about crop planning and sales timing. Advanced analytics and machine learning algorithms are now being used to predict market trends, analyze price fluctuations, and identify optimal selling opportunities. These systems process vast amounts of data including historical prices, weather patterns, global supply and demand, economic indicators, and even social media sentiment. By identifying patterns and correlations in this data, farmers can anticipate market movements and adjust their strategies accordingly. For example, if the system predicts a price increase for a particular crop in the coming months, farmers might choose to delay their harvest or storage decisions. Conversely, if a price drop is anticipated, they might accelerate their sales or consider alternative crops. This data-driven approach to market analysis helps farmers reduce uncertainty and make more profitable decisions. The integration of real-time market data with farm management systems creates a comprehensive platform for agricultural decision-making.',
      image: '/blog3.png',
      src: '/public/blog3.png',
      icon: <FaChartLine className="text-purple-500" />,
    },
    {
      title: 'Climate-Resilient Farming Techniques',
      content: 'As climate change continues to impact agricultural systems worldwide, farmers are adopting innovative techniques to build resilience and ensure sustainable food production. Climate-resilient farming involves implementing practices that help agricultural systems adapt to changing weather patterns, extreme events, and environmental challenges. These techniques include drought-resistant crop varieties, water-efficient irrigation systems, soil conservation methods, and integrated pest management strategies. Precision agriculture technologies play a crucial role in climate adaptation, enabling farmers to optimize resource use and minimize environmental impact. For instance, sensor-based irrigation systems can adjust water delivery based on real-time soil moisture and weather data, ensuring optimal water use even during drought conditions. Similarly, climate-smart crop rotation and cover cropping techniques help maintain soil health and reduce vulnerability to extreme weather events. The adoption of renewable energy sources, such as solar-powered irrigation systems, further enhances the sustainability and resilience of farming operations. By combining traditional knowledge with modern technology, farmers can develop robust systems that can withstand climate challenges while maintaining productivity and environmental stewardship.',
      image: '/blog4.png',
      src: '/public/blog4.png',
      icon: <FaCloudSun className="text-orange-500" />,
    },
  ];

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/blogs?isPublished=true&limit=10');
      const blogData = response.data?.data || response.data || [];
      setBlogs(blogData);
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Failed to load blog posts. Showing fallback content.');
      setBlogs(fallbackSections);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 text-gray-800 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800">
      <HomeButton />
      {/* Hero Section */}
      <header className="relative h-[60vh] bg-cover bg-center" style={{ backgroundImage: "url('/farm.jpg')" }}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center text-white p-8 bg-white/10 rounded-xl shadow-lg max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">The Future of Smart Farming with AI</h1>
            <p className="text-lg md:text-xl">
              Discover how Artificial Intelligence and digital platforms are empowering farmers with data-driven insights for a more sustainable and profitable future.
            </p>
            {error && (
              <div className="mt-4 text-yellow-200 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Blog Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        {blogs.map((section, index) => (
          <section key={section._id || index} className={`flex flex-col md:flex-row items-center gap-12 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
            <div className="md:w-1/2">
              <img 
                src={section.coverImage?.url || section.image} 
                alt={section.title} 
                className="rounded-xl shadow-lg w-full h-auto object-cover" 
              />
            </div>
            <div className="md:w-1/2 space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{section.icon || <FaLeaf className="text-green-500" />}</div>
                <h2 className="text-3xl font-bold">{section.title}</h2>
              </div>
              <p className="text-lg leading-relaxed">{section.content}</p>
              {section.excerpt && section.excerpt !== section.content && (
                <p className="text-gray-600 italic">{section.excerpt}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {section.category && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {section.category}
                  </span>
                )}
                {section.tags && section.tags.length > 0 && (
                  <div className="flex gap-1">
                    {section.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span key={tagIndex} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {section.publishedAt && (
                  <span>{new Date(section.publishedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default Blog;