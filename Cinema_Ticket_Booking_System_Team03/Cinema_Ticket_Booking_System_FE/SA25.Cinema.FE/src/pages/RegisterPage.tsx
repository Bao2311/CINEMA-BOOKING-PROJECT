import React from 'react';
import Layout from '../components/Layout/Layout';
import RegisterForm from '../components/Auth/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto">
          <RegisterForm />
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;