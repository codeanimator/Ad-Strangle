"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, ExternalLink, ShieldAlert, CheckCircle, Clock, Image as ImageIcon, X, FileDown, Trash2, ShieldCheck, Mail } from 'lucide-react';
import { generateForensicReport } from '@/lib/reportGenerator';
import { db } from '@/lib/firebase/config';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';

export interface Violation {
  id: string;
  timestamp: any;
  brandName: string;
  pirateUrl: string;
  status: 'Pending' | 'Takedown Sent' | 'Resolved' | 'Escalated' | 'Completed';
  evidenceImage?: string;
  source?: string;
  redirectPath?: string[];
  middlemanUrl?: string;
}

const statusStyles = {
  'Pending': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Takedown Sent': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Resolved': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Escalated': 'bg-red-500/10 text-red-500 border-red-500/20',
  'Completed': 'bg-green-500/10 text-green-500 border-green-500/20',
};

const statusIcons = {
  'Pending': <Clock className="w-4 h-4 mr-1.5" />,
  'Takedown Sent': <ShieldAlert className="w-4 h-4 mr-1.5" />,
  'Resolved': <CheckCircle className="w-4 h-4 mr-1.5" />,
  'Escalated': <ShieldAlert className="w-4 h-4 mr-1.5" />,
  'Completed': <CheckCircle className="w-4 h-4 mr-1.5" />,
};

export const ViolationsTable = ({ data }: { data: Violation[] }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownloadReport = async (item: Violation) => {
    setIsGenerating(item.id);
    const formattedTimestamp = item.timestamp?.seconds 
      ? new Date(item.timestamp.seconds * 1000).toLocaleString() 
      : item.timestamp?.toString() || 'Recent';

    await generateForensicReport({
      ...item,
      timestamp: formattedTimestamp
    });
    setIsGenerating(null);
    setActiveMenu(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'violations', id));
        setActiveMenu(null);
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'violations', id), { status: newStatus });
      setActiveMenu(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md relative">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 bg-white/[0.03]">
            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Timestamp</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Evidence</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Brand Name</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Destination URL</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                No real-time violations detected yet. Launch a scan to begin.
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="group hover:bg-white/[0.04] transition-colors duration-200">
                <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                  {item.timestamp?.seconds 
                    ? new Date(item.timestamp.seconds * 1000).toLocaleString() 
                    : item.timestamp?.toString() || 'Recent'}
                </td>
                <td className="px-6 py-4">
                  {item.evidenceImage ? (
                    <div 
                      className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 overflow-hidden cursor-pointer hover:border-cyan-500 transition-all relative group/thumb"
                      onClick={() => setSelectedImage(item.evidenceImage!)}
                    >
                      <img src={item.evidenceImage} alt="Evidence" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                        <ImageIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-white">
                  {item.brandName === 'none' || item.brandName === 'ANALYZING DESTINATION HEADERS' ? (
                    <span className="animate-pulse text-cyan-400">ANALYZING DESTINATION HEADERS</span>
                  ) : item.brandName}
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">
                    {item.source?.includes('Heuristic') ? 'Heuristic' : (item.source?.split(' ').pop() || 'Scanner')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-cyan-400/80 group-hover:text-cyan-400">
                  <a href={item.pirateUrl} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
                    {item?.pirateUrl?.length > 25 ? item.pirateUrl.substring(0, 25) + '...' : item.pirateUrl || 'Analyzing...'}
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[item.status] || statusStyles['Pending']}`}>
                    {statusIcons[item.status] || statusIcons['Pending']}
                    {item.status === 'Escalated' ? 'Forensic Match' : item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right relative">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleDownloadReport(item)}
                      disabled={isGenerating === item.id}
                      className="p-2 text-gray-400 hover:text-cyan-400 transition-colors bg-white/5 rounded-lg border border-white/10 hover:border-cyan-400/50"
                      title="Download Forensic Report"
                    >
                      {isGenerating === item.id ? (
                        <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FileDown className="w-5 h-5" />
                      )}
                    </button>
                    <button 
                      onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                      className={`p-2 transition-colors rounded-lg border ${activeMenu === item.id ? 'bg-white/10 text-white border-white/20' : 'text-gray-400 hover:text-white border-transparent'}`}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {/* Action Dropdown Menu */}
                    {activeMenu === item.id && (
                      <div 
                        ref={menuRef}
                        className="absolute right-6 top-14 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in duration-200"
                      >
                        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Manage Violation</div>
                        
                        <button 
                          onClick={() => updateStatus(item.id, 'Takedown Sent')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4 text-blue-400" /> Mark Takedown Sent
                        </button>
                        
                        <button 
                          onClick={() => updateStatus(item.id, 'Resolved')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-green-400" /> Mark Resolved
                        </button>

                        <div className="h-px bg-white/5 my-1" />
                        
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 font-medium"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Entry
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-8 right-8 p-2 text-white/50 hover:text-white">
            <X className="w-8 h-8" />
          </button>
          <img src={selectedImage} alt="Full Evidence" className="max-w-full max-h-full rounded-xl shadow-2xl border border-white/10" />
        </div>
      )}
    </div>
  );
};
