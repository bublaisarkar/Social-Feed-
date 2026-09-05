import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Feed from './components/Feed';

const AppContent = () => {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3">
          <span className="bg-indigo-100 text-indigo-700 p-2.5 rounded-xl">
            <i className="fas fa-rss text-xl"></i>
          </span>
          <span className="text-2xl font-bold text-slate-800">
            Feed<span className="text-indigo-600">Flow</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 hidden sm:inline">
            <i className="far fa-user-circle text-indigo-400 mr-1"></i>
            <span className="font-medium text-slate-700">{user.username}</span>
          </span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5 bg-red-50 px-4 py-2 rounded-full border border-red-100/50 transition hover:bg-red-100"
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      {/* Feed */}
      <Feed />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;