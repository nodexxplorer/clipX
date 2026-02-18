// frontend/src/pages/admin/movies/create.jsx
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/layout/AdminLayout';
import MovieForm from '../../../components/admin/movies/MovieForm';
import { ADMIN_CREATE_MOVIE } from '../../../graphql/mutations/adminMutations';
import toast from 'react-hot-toast';

export default function CreateMovie() {
  const router = useRouter();
  const [createMovie, { loading }] = useMutation(ADMIN_CREATE_MOVIE, {
    onCompleted: (data) => {
      toast.success('Movie created successfully');
      router.push(`/admin/movies/${data.adminCreateMovie.id}`);
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSubmit = (formData) => {
    createMovie({ variables: { input: formData } });
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">Add New Movie</h1>
        <MovieForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </AdminLayout>
  );
}