import React, { useState } from 'react'
import { InfoIcon, XIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function FormatTip() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="mb-3 px-1 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
        <span className="shrink-0 mt-0.5">⚠️</span>
        <span className="flex-1">
          链接需以 <code className="bg-amber-100 px-1 rounded">http://</code> 或{' '}
          <code className="bg-amber-100 px-1 rounded">https://</code> 开头，每行一个链接，以空格或换行分隔。
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="shrink-0 mt-0.5 p-0.5 rounded-full hover:bg-amber-200/60 transition-colors"
          title="查看详细格式说明"
        >
          <InfoIcon size={14} />
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false)
            }}
          >
            <div className="min-h-full flex items-start justify-center p-4 py-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
              >
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <InfoIcon size={20} className="text-purple-600" />
                    链接格式说明
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XIcon size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-5 text-sm text-gray-700 leading-relaxed">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">✅ 基本规则</h4>
                    <ul className="space-y-1.5 list-disc list-inside text-gray-600">
                      <li>
                        链接必须以 <code className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-xs font-mono">http://</code> 或{' '}
                        <code className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-xs font-mono">https://</code> 开头
                      </li>
                      <li>链接以 <strong>换行</strong> 或 <strong>空格</strong> 作为结束标志</li>
                      <li>每行可包含一个或多个链接</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">📝 混合内容支持</h4>
                    <p className="text-gray-600 mb-2">
                      每一行可以包含其他任意字符串，系统会自动识别并提取其中以{' '}
                      <code className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-xs font-mono">http://</code> 或{' '}
                      <code className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-xs font-mono">https://</code> 开头的链接。
                    </p>
                    <div className="bg-gray-50 rounded-xl p-3 font-mono text-xs space-y-1 border border-gray-200">
                      <p className="text-gray-400"># 示例输入：</p>
                      <p>
                        访问官网 <span className="text-purple-600">https://example.com</span> 了解详情
                      </p>
                      <p>
                        推广链接：<span className="text-purple-600">https://shop.example.com/product?id=123</span>
                      </p>
                      <p>
                        <span className="text-purple-600">http://old-site.com</span> 旧站点需要跳转
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">📄 文档 & 富文本</h4>
                    <p className="text-gray-600">支持直接从以下来源复制粘贴内容，系统会自动提取其中的链接：</p>
                    <ul className="mt-2 space-y-1.5 list-disc list-inside text-gray-600">
                      <li>Word、Excel、PDF 等文档中的链接</li>
                      <li>网页富文本中的超链接</li>
                      <li>邮件、聊天记录中的链接</li>
                      <li>Markdown、HTML 源码中的 URL</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">⚠️ 注意事项</h4>
                    <ul className="space-y-1.5 list-disc list-inside text-gray-600">
                      <li>
                        不含 <code className="bg-gray-100 px-1 rounded text-xs font-mono">http://</code> 或{' '}
                        <code className="bg-gray-100 px-1 rounded text-xs font-mono">https://</code> 前缀的文本不会被识别为链接
                      </li>
                      <li>链接中不能包含空格，空格会被视为链接的结束</li>
                      <li>批量模式最多支持 10000 条链接，文件模式无数量限制（最大 10MB）</li>
                    </ul>
                  </div>
                </div>

                <div className="p-5 border-t border-gray-100">
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-medium transition-colors"
                  >
                    我知道了
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
