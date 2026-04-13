// frontend/src/pages/lists.js — Custom Lists (Letterboxd-style) (Section 13)
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GET_MY_CUSTOM_LISTS, CREATE_CUSTOM_LIST
} from '@/graphql/queries/adminQueries';
import {
  FiPlus, FiList, FiTrash2, FiGlobe, FiLock,
  FiImage, FiChevronRight, FiX, FiCheck
} from 'react-icons/fi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CustomListsPage() {
  const { data, loading, refetch } = useQuery(GET_MY_CUSTOM_LISTS, {
    fetchPolicy: 'cache-and-network',
  });
  const [createList, { loading: creating }] = useMutation(CREATE_CUSTOM_LIST);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', isPublic: false });
  const [toast, setToast] = useState(null);

  const lists = data?.myCustomLists || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await createList({
        variables: { input: { name: form.name, description: form.description, isPublic: form.isPublic } },
      });
      setToast('List created!');
      setShowModal(false);
      setForm({ name: '', description: '', isPublic: false });
      refetch();
    } catch (err) {
      setToast('Failed to create list');
    }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      <Head>
        <title>My Lists - clipX</title>
        <meta name="description" content="Create and manage your custom movie and series collections on clipX." />
      </Head>

      <div className="min-h-screen pt-28 pb-20 px-4 md:px-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-semibold mb-4">
                <FiList className="w-4 h-4" />
                My Lists
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Your Collections</h1>
              <p className="text-gray-400 mt-2">Create custom compilations of your favourite movies and series.</p>
            </div>
            <button
              onClick={() => setShowModal(true)} id="create-list-btn"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" /> New List
            </button>
          </motion.div>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-6 flex items-center gap-2 p-3 rounded-xl text-sm font-medium bg-green-500/10 border border-green-500/20 text-green-400"
              >
                <FiCheck className="w-4 h-4" /> {toast}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lists Grid */}
          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
          ) : lists.length === 0 ? (
            <div className="text-center py-20">
              <FiList className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-bold mb-2">No lists yet</p>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                Create your first list to start organising your favourite content like a pro.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors"
              >
                <FiPlus className="w-4 h-4" /> Create Your First List
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {lists.map((list, i) => (
                <motion.div
                  key={list.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative rounded-2xl bg-white/[0.03] border border-white/10 hover:border-primary-500/30 transition-all duration-300 overflow-hidden"
                >
                  {/* Poster preview strip */}
                  <div className="h-24 bg-gradient-to-br from-primary-600/20 to-violet-600/20 relative overflow-hidden">
                    <div className="flex gap-0.5 absolute inset-0">
                      {(list.items || []).slice(0, 4).map((item, j) => (
                        <div key={j} className="flex-1 h-full bg-gray-800">
                          {item.posterUrl && (
                            <img src={item.posterUrl} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                          )}
                        </div>
                      ))}
                      {(!list.items || list.items.length === 0) && (
                        <div className="flex-1 flex items-center justify-center text-gray-600">
                          <FiImage className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-bold truncate">{list.name}</h3>
                      {list.isPublic ? (
                        <FiGlobe className="w-3.5 h-3.5 text-green-400 flex-shrink-0" title="Public" />
                      ) : (
                        <FiLock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" title="Private" />
                      )}
                    </div>
                    {list.description && (
                      <p className="text-gray-500 text-xs mb-2 line-clamp-2">{list.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-gray-600 text-xs">{list.items?.length || 0} titles</span>
                      <FiChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary-400 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create List Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white">Create New List</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">List Name</label>
                  <input
                    type="text" value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Weekend Watchlist"
                    required id="list-name-input"
                    className="w-full bg-white/5 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Description (optional)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="What's this list about?"
                    id="list-desc-input"
                    className="w-full bg-white/5 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none transition-colors resize-none"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox" checked={form.isPublic}
                    onChange={(e) => setForm(f => ({ ...f, isPublic: e.target.checked }))}
                    className="w-4 h-4 rounded bg-white/10 border-white/20 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-400">Make this list public</span>
                </label>
                <button
                  type="submit" disabled={creating || !form.name.trim()}
                  id="list-create-submit"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? <LoadingSpinner size="sm" /> : <FiPlus className="w-4 h-4" />}
                  {creating ? 'Creating…' : 'Create List'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
