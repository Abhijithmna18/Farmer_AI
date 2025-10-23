import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Send, Loader2, CheckCircle, AlertCircle, User, Mail, Phone, MessageSquare, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../services/apiClient';

// Validation schema
const contactSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters'),
  phone: yup
    .string()
    .nullable()
    .transform((value) => value === '' ? null : value)
    .test('phone-format', 'Please enter a valid phone number (digits only)', function(value) {
      if (!value) return true; // Optional field
      return /^\d{10,15}$/.test(value.replace(/\D/g, ''));
    }),
  subject: yup
    .string()
    .required('Subject is required')
    .min(3, 'Subject must be at least 3 characters')
    .max(100, 'Subject must be less than 100 characters'),
  message: yup
    .string()
    .required('Message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
});

const ContactUsForm = ({ onSuccess, className = '' }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch
  } = useForm({
    resolver: yupResolver(contactSchema),
    mode: 'onChange'
  });

  const messageLength = watch('message')?.length || 0;

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Clean phone number (remove non-digits)
      if (data.phone) {
        data.phone = data.phone.replace(/\D/g, '');
      }

      const response = await apiClient.post('/contact', data);
      
      setSubmitStatus('success');
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Reset form after successful submission
      reset();
    } catch (error) {
      setSubmitStatus('error');
      const errorMessage = error.response?.data?.message || 'Failed to send message. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const InputField = ({ name, label, type = 'text', placeholder, icon: Icon, required = false, ...props }) => (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          {...register(name)}
          type={type}
          id={name}
          placeholder={placeholder}
          className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
            errors[name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          aria-invalid={errors[name] ? 'true' : 'false'}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
          {...props}
        />
      </div>
      {errors[name] && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-red-600"
          id={`${name}-error`}
          role="alert"
        >
          <AlertCircle className="h-4 w-4" />
          {errors[name].message}
        </motion.div>
      )}
    </div>
  );

  const TextareaField = ({ name, label, placeholder, icon: Icon, required = false, maxLength, ...props }) => (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <div className="absolute top-3 left-3 flex items-start pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
        </div>
        <textarea
          {...register(name)}
          id={name}
          placeholder={placeholder}
          rows={4}
          maxLength={maxLength}
          className={`block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-vertical ${
            errors[name] ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          aria-invalid={errors[name] ? 'true' : 'false'}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
          {...props}
        />
        {maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {messageLength}/{maxLength}
          </div>
        )}
      </div>
      {errors[name] && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-red-600"
          id={`${name}-error`}
          role="alert"
        >
          <AlertCircle className="h-4 w-4" />
          {errors[name].message}
        </motion.div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white rounded-2xl shadow-xl border border-gray-200 p-8 ${className}`}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Get in Touch</h2>
        <p className="text-gray-600">
          Have a question or need help? We'd love to hear from you.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            name="name"
            label="Full Name"
            placeholder="Enter your full name"
            icon={User}
            required
            autoComplete="name"
          />
          <InputField
            name="email"
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            icon={Mail}
            required
            autoComplete="email"
          />
        </div>

        <InputField
          name="phone"
          label="Phone Number"
          type="tel"
          placeholder="Enter your phone number (optional)"
          icon={Phone}
          autoComplete="tel"
        />

        <InputField
          name="subject"
          label="Subject"
          placeholder="What's this about?"
          icon={FileText}
          required
        />

        <TextareaField
          name="message"
          label="Message"
          placeholder="Tell us more about your inquiry..."
          icon={MessageSquare}
          required
          maxLength={1000}
        />

        <motion.button
          type="submit"
          disabled={isSubmitting || !isValid}
          className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-semibold text-white transition-all duration-200 ${
            isSubmitting || !isValid
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
          }`}
          whileHover={!isSubmitting && isValid ? { scale: 1.02 } : {}}
          whileTap={!isSubmitting && isValid ? { scale: 0.98 } : {}}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending Message...
            </>
          ) : submitStatus === 'success' ? (
            <>
              <CheckCircle className="h-5 w-5" />
              Message Sent!
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Send Message
            </>
          )}
        </motion.button>

        {submitStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
            role="alert"
          >
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              Failed to send message. Please try again or contact us directly.
            </span>
          </motion.div>
        )}
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500">
          <p>We typically respond within 24 hours.</p>
          <p className="mt-1">
            For urgent matters, call us at{' '}
            <a href="tel:+15555555556" className="text-green-600 hover:text-green-700 font-medium">
              +1 (555) 555-5556
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ContactUsForm;
