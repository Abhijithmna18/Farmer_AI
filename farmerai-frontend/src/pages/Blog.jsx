import React from 'react';
import { FaLeaf, FaTractor, FaChartLine, FaCloudSun } from 'react-icons/fa';
import HomeButton from '../components/HomeButton';

const Blog = () => {
  const sections = [
    {
      title: 'AI-Powered Crop Recommendations',
      content: 'Artificial Intelligence is revolutionizing crop management by providing farmers with data-driven recommendations for what to plant, when to plant, and how to optimize yields. By analyzing historical weather patterns, soil composition, and market demand, AI algorithms can suggest the most profitable and sustainable crop choices. This technology helps farmers mitigate risks associated with climate change and market volatility. For instance, an AI system might recommend planting a drought-resistant crop variety in a region with a high probability of low rainfall. Furthermore, these systems can provide personalized advice based on the specific conditions of a farm, taking into account factors like soil pH, nutrient levels, and local pest prevalence. This level of precision enables farmers to make more informed decisions, leading to increased productivity and profitability while minimizing environmental impact. The adoption of AI in crop selection is a significant step towards a more resilient and efficient agricultural sector, empowering farmers to thrive in an ever-changing world.',
      image: '/blog1.jpg',
      icon: <FaLeaf className="text-green-500" />,
    },
    {
      title: 'Soil Health Monitoring via Phone Camera',
      content: 'The ability to assess soil health quickly and accurately is crucial for sustainable farming. Emerging technologies now allow farmers to monitor soil health using just their smartphone cameras. By taking a picture of a soil sample, an AI-powered application can analyze its color, texture, and structure to provide an instant assessment of its condition. This analysis can reveal vital information about organic matter content, moisture levels, and potential nutrient deficiencies. This approach is not only cost-effective but also highly accessible, as it eliminates the need for expensive lab equipment and time-consuming tests. Farmers can get real-time feedback on their soil management practices, such as the impact of cover cropping or no-till farming. This immediate feedback loop allows for rapid adjustments and continuous improvement of soil health. By putting the power of soil analysis in the hands of every farmer, this technology democratizes access to critical agricultural data and promotes more sustainable land management practices globally.',
      image: '/blog2.jpg',
      icon: <FaTractor className="text-yellow-500" />,
    },
    {
      title: 'Market Price Forecasting for Farmers',
      content: 'One of the biggest challenges for smallholder farmers is navigating the unpredictable nature of market prices. AI-powered forecasting tools are changing this by providing farmers with accurate predictions of future commodity prices. These tools analyze a vast array of data, including historical price trends, weather forecasts, global supply and demand, and even social media sentiment. By understanding these market dynamics, farmers can make strategic decisions about when to sell their produce to maximize their income. For example, if a price surge is predicted for a particular crop, a farmer might decide to store their harvest for a few weeks to take advantage of the higher prices. This can make a significant difference in their profitability and economic stability. These forecasting tools also help farmers plan their planting seasons more effectively, aligning their production with anticipated market demand. By reducing uncertainty and empowering farmers with market intelligence, AI is helping to create a more equitable and prosperous agricultural economy.',
      image: '/blog3.jpg',
      icon: <FaChartLine className="text-blue-500" />,
    },
    {
      title: 'Building Sustainable Agriculture with Technology',
      content: 'Technology is at the heart of the movement towards a more sustainable agricultural system. From precision irrigation systems that conserve water to drones that monitor crop health and apply treatments with pinpoint accuracy, innovation is driving efficiency and reducing the environmental footprint of farming. These technologies allow farmers to produce more food with fewer resources, which is essential for feeding a growing global population while protecting our planet. For example, sensor-based irrigation systems can reduce water usage by up to 50% by delivering water directly to the plant roots when it is most needed. Similarly, drones equipped with multispectral cameras can identify areas of a field that are under stress from pests or disease, allowing for targeted application of pesticides instead of blanket spraying. This not only saves money but also minimizes chemical runoff into waterways. By embracing these technological advancements, we can build a more resilient, productive, and sustainable food system for generations to come.',
      image: '/blog4.jpg',
      icon: <FaCloudSun className="text-orange-500" />,
    },
  ];

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
          </div>
        </div>
      </header>

      {/* Main Blog Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        {sections.map((section, index) => (
          <section key={index} className={`flex flex-col md:flex-row items-center gap-12 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
            <div className="md:w-1/2">
              <img src={section.image} alt={section.title} className="rounded-xl shadow-lg w-full h-auto object-cover" />
            </div>
            <div className="md:w-1/2 space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{section.icon}</div>
                <h2 className="text-3xl font-bold">{section.title}</h2>
              </div>
              <p className="text-lg leading-relaxed">{section.content}</p>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default Blog;