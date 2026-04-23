import React from 'react'
import { motion } from 'framer-motion'
import { Link, List, FileText } from 'lucide-react'

type Tab = 'single' | 'batch' | 'file'

interface TabSwitcherProps {
  activeTab: Tab
  onChange: (tab: Tab) => void
}

export function TabSwitcher({ activeTab, onChange }: TabSwitcherProps) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'single', label: '单链转换', icon: <Link size={16} /> },
    { id: 'batch', label: '批量转换', icon: <List size={16} /> },
    { id: 'file', label: '文件上传', icon: <FileText size={16} /> },
  ]

  return (
    <div className="flex p-1 bg-gray-100 rounded-2xl w-full sm:w-fit mb-6 sm:mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-xl transition-colors z-10 ${activeTab === tab.id ? 'text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 bg-white rounded-xl shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
