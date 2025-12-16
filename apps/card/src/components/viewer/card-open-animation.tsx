'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface CardOpenAnimationProps {
  isOpen: boolean;
  children: ReactNode;
  onOpenComplete?: () => void;
}

export function CardOpenAnimation({ isOpen, children, onOpenComplete }: CardOpenAnimationProps) {
  return (
    <AnimatePresence mode="wait">
      {!isOpen ? (
        // 닫힌 카드 (봉투 형태)
        <motion.div
          key="closed"
          className="relative w-full max-w-md aspect-[4/5] cursor-pointer"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{
            rotateY: 180,
            scale: 0.9,
            opacity: 0,
            transition: { duration: 0.6, ease: 'easeInOut' }
          }}
        >
          {/* 봉투 뒷면 */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl shadow-2xl" />

          {/* 봉투 앞면 (삼각형 덮개) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full relative">
              {/* 봉투 본체 */}
              <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-b from-red-500 to-red-700 rounded-b-2xl" />

              {/* 삼각형 덮개 */}
              <div
                className="absolute top-0 left-0 right-0 h-1/2"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                }}
              />

              {/* 씰 */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <motion.div
                  className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <span className="text-2xl">💌</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        // 열린 카드
        <motion.div
          key="open"
          className="w-full max-w-md"
          initial={{
            rotateY: -180,
            scale: 0.8,
            opacity: 0
          }}
          animate={{
            rotateY: 0,
            scale: 1,
            opacity: 1,
            transition: {
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              opacity: { duration: 0.3 }
            }
          }}
          onAnimationComplete={onOpenComplete}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 카드 내용 fade in 애니메이션
export function CardContentAnimation({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: 'easeOut'
      }}
    >
      {children}
    </motion.div>
  );
}

// 텍스트 타이핑 효과
export function TypingAnimation({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.1,
            delay: delay + index * 0.03,
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}
