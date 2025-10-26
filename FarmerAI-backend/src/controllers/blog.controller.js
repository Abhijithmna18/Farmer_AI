const Blog = require('../models/Blog');
const { deleteFile, getFileUrl } = require('../middlewares/imageUpload.middleware');
const path = require('path');

// Get all blog posts
const getBlogPosts = async (req, res) => {
  try {
    const { category, isPublished, featured, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    if (featured !== undefined) query.featured = featured === 'true';
    
    const skip = (page - 1) * limit;
    
    const posts = await Blog.find(query)
      .populate('author', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Blog.countDocuments(query);
    
    res.json({
      success: true,
      data: posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts'
    });
  }
};

// Get single blog post
const getBlogPost = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id)
      .populate('author', 'name email')
      .populate('lastModifiedBy', 'name email');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Increment view count
    post.viewCount += 1;
    await post.save();
    
    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog post'
    });
  }
};

// Get blog post by slug
const getBlogPostBySlug = async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug })
      .populate('author', 'name email')
      .populate('lastModifiedBy', 'name email');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Increment view count
    post.viewCount += 1;
    await post.save();
    
    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog post'
    });
  }
};

// Create blog post
const createBlogPost = async (req, res) => {
  try {
    const { 
      title, 
      content, 
      excerpt, 
      category, 
      tags, 
      isPublished, 
      featured, 
      metaDescription 
    } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Cover image is required'
      });
    }
    
    const imageUrl = getFileUrl(req, req.file.filename, 'blogs');
    
    const blogPost = new Blog({
      title,
      content,
      excerpt: excerpt || content.substring(0, 500),
      coverImage: {
        url: imageUrl,
        alt: title,
        filename: req.file.filename
      },
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      author: req.user.id,
      isPublished: isPublished === 'true',
      publishedAt: isPublished === 'true' ? new Date() : null,
      featured: featured === 'true',
      metaDescription,
      lastModifiedBy: req.user.id
    });
    
    await blogPost.save();
    
    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: blogPost
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog post'
    });
  }
};

// Update blog post
const updateBlogPost = async (req, res) => {
  try {
    const { 
      title, 
      content, 
      excerpt, 
      category, 
      tags, 
      isPublished, 
      featured, 
      metaDescription 
    } = req.body;
    
    const blogPost = await Blog.findById(req.params.id);
    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Handle image update
    let imageData = blogPost.coverImage;
    if (req.file) {
      // Delete old image
      const oldImagePath = path.join(__dirname, '../../uploads/blogs', blogPost.coverImage.filename);
      deleteFile(oldImagePath);
      
      // Set new image
      const imageUrl = getFileUrl(req, req.file.filename, 'blogs');
      imageData = {
        url: imageUrl,
        alt: title || blogPost.title,
        filename: req.file.filename
      };
    }
    
    const updateData = {
      title: title || blogPost.title,
      content: content || blogPost.content,
      excerpt: excerpt || blogPost.excerpt,
      category: category || blogPost.category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : blogPost.tags,
      isPublished: isPublished !== undefined ? isPublished === 'true' : blogPost.isPublished,
      publishedAt: isPublished === 'true' && !blogPost.publishedAt ? new Date() : blogPost.publishedAt,
      featured: featured !== undefined ? featured === 'true' : blogPost.featured,
      metaDescription: metaDescription || blogPost.metaDescription,
      coverImage: imageData,
      lastModifiedBy: req.user.id
    };
    
    const updatedPost = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name email')
     .populate('lastModifiedBy', 'name email');
    
    res.json({
      success: true,
      message: 'Blog post updated successfully',
      data: updatedPost
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog post'
    });
  }
};

// Delete blog post
const deleteBlogPost = async (req, res) => {
  try {
    const blogPost = await Blog.findById(req.params.id);
    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Delete associated image file
    const imagePath = path.join(__dirname, '../../uploads/blogs', blogPost.coverImage.filename);
    deleteFile(imagePath);
    
    await Blog.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog post'
    });
  }
};

module.exports = {
  getBlogPosts,
  getBlogPost,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost
};


