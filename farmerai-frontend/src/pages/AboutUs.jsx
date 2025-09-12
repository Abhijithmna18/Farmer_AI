import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Eye, Users, Zap, Leaf, HeartHandshake } from 'lucide-react';
import HomeButton from '../components/HomeButton';

const AboutUs = () => {
  const teamMembers = [
    {
      name: 'Dr. Evelyn Reed',
      role: 'Founder & CEO',
      bio: 'With a Ph.D. in Agricultural Science and a passion for technology, Evelyn founded FarmerAI to bridge the gap between farming and AI.',
      image: '/team1.jpg', // Placeholder: Replace with actual image
    },
    {
      name: 'Marcus Chen',
      role: 'Lead AI Engineer',
      bio: 'Marcus leads the development of our AI models, turning complex data into actionable insights for farmers.',
      image: '/team2.jpg', // Placeholder: Replace with actual image
    },
    {
      name: 'Aisha Bello',
      role: 'Head of Farmer Relations',
      bio: 'Aisha works directly with our farming communities to ensure our solutions meet their real-world needs.',
      image: '/team3.jpg', // Placeholder: Replace with actual image
    },
    {
        name: 'Tom Haskins',
        role: 'Product Designer',
        bio: 'Tom designs the user-friendly interfaces that make our technology accessible to everyone.',
        image: '/team4.jpg', // Placeholder: Replace with actual image
    }
  ];

  const coreValues = [
    {
      icon: <Zap size={32} className="text-green-500" />,
      title: 'Innovation',
      description: 'We are committed to pushing the boundaries of what\'s possible in agriculture through continuous research and development.',
    },
    {
      icon: <Users size={32} className="text-green-500" />,
      title: 'Accessibility',
      description: 'Our goal is to make powerful AI tools available and easy to use for every farmer, regardless of their technical skills.',
    },
    {
      icon: <Leaf size={32} className="text-green-500" />,
      title: 'Sustainability',
      description: 'We believe in promoting farming practices that are not only profitable but also environmentally responsible.',
    },
    {
      icon: <HeartHandshake size={32} className="text-green-500" />,
      title: 'Farmer-Centric Approach',
      description: 'Our farmers are at the heart of everything we do. We listen to their needs and build solutions that truly help them succeed.',
    },
  ];

  return (
    <div className="bg-gray-50 text-gray-800">
      <HomeButton />
      {/* Hero Section */}
      <header className="relative h-[70vh] bg-cover bg-center" style={{ backgroundImage: "url('/farm.jpg')" }}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center">
          <div className="text-center text-white p-12 bg-white/10 border border-white/20 rounded-xl shadow-lg max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-4">About FarmerAI</h1>
            <p className="text-xl md:text-2xl">
              Empowering Farmers with AI-Powered Agriculture
            </p>
          </div>
        </div>
      </header>

      <main>
        {/* Our Story Section */}
        <section className="py-20 px-4">
          <article className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Our Story</h2>
            <div className="text-lg leading-relaxed space-y-6">
              <p>
                Modern agriculture is a complex and challenging field. Farmers, the backbone of our food system, constantly battle unpredictable weather, fluctuating market prices, and the ever-present threat of crop diseases and soil degradation. They are often forced to make high-stakes decisions with incomplete information, leading to wasted resources, lower yields, and financial instability. We saw these struggles and recognized a massive opportunity to make a difference. We believed that technology, specifically Artificial Intelligence, could provide the tools and insights needed to overcome these challenges and create a more resilient and prosperous future for farming.
              </p>
              <p>
                FarmerAI was born from this vision. It started as a small project by a group of passionate technologists and agricultural experts who wanted to apply their skills to a meaningful problem. We spent months working alongside farmers, listening to their stories, and understanding their pain points. This hands-on experience was invaluable, shaping our approach and ensuring that our solutions were grounded in the realities of farm life. Our journey has been one of collaboration, innovation, and a relentless commitment to our mission.
              </p>
              <p>
                Our mission is to democratize access to advanced agricultural technology. We aim to empower every farmer with the data-driven insights they need to increase profitability, improve sustainability, and build a thriving business. We are dedicated to creating a future where farming is not just a livelihood but a smart, data-informed, and rewarding profession for generations to come.
              </p>
            </div>
          </article>
        </section>

        {/* Our Mission & Vision Section */}
        <section className="bg-green-50 py-20 px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
            <aside className="bg-white p-8 rounded-xl shadow-lg text-center">
              <Target className="mx-auto text-green-600 mb-4" size={48} />
              <h3 className="text-3xl font-bold mb-4">Our Mission</h3>
              <p className="text-lg">
                To empower farmers with accessible, data-driven AI tools that enhance productivity, profitability, and environmental sustainability.
              </p>
            </aside>
            <aside className="bg-white p-8 rounded-xl shadow-lg text-center">
              <Eye className="mx-auto text-green-600 mb-4" size={48} />
              <h3 className="text-3xl font-bold mb-4">Our Vision</h3>
              <p className="text-lg">
                A future where every farm is a smart farm, and technology helps build a resilient and equitable global food system.
              </p>
            </aside>
          </div>
        </section>

        {/* Meet the Team Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-12">Meet the Team</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-transform duration-300">
                  {/* Placeholder for team member image */}
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h4 className="text-xl font-bold">{member.name}</h4>
                  <p className="text-green-600 font-semibold mb-2">{member.role}</p>
                  <p className="text-sm text-gray-600">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="bg-gray-100 py-20 px-4">
            <div className="max-w-6xl mx-auto text-center">
                <h2 className="text-4xl font-bold mb-12">Our Core Values</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {coreValues.map((value, index) => (
                        <div key={index} className="p-8 bg-white/50 backdrop-blur-lg border border-white/20 rounded-xl shadow-md">
                            <div className="mb-4">{value.icon}</div>
                            <h4 className="text-xl font-bold mb-2">{value.title}</h4>
                            <p className="text-gray-700">{value.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* CTA Section */}
        <section className="bg-green-600 text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">Join us in building the future of agriculture.</h2>
            <p className="text-xl mb-8">
              Get started today and see how FarmerAI can transform your farm.
            </p>
            <Link to="/register">
              <button className="bg-white text-green-600 font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-200 transition-colors duration-300">
                Get Started
              </button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AboutUs;
