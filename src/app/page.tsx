"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "motion/react";
import { Utensils, Store, ArrowRight, Sparkles } from "lucide-react";

export default function LandingPage() {
    const router = useRouter();

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans overflow-hidden">
            {/* Left side: Hero Image */}
            <motion.div 
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative w-full lg:w-[55%] h-[40vh] lg:h-screen"
            >
                <Image
                    src="/images/dealplatehero.webp"
                    alt="Delicious rescued meals"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover"
                />
                {/* Premium Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-black/70 lg:via-black/40 lg:to-transparent flex items-end lg:items-center p-8 lg:p-20">
                    <div className="max-w-xl text-white">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
                                <Sparkles className="w-4 h-4 text-[#FF6B00]" />
                                <span className="text-sm font-semibold tracking-wide text-orange-50">Rescue. Save. Enjoy.</span>
                            </div>
                            <h2 className="text-4xl lg:text-6xl font-display font-extrabold mb-6 leading-tight">
                                Delicious Meals. <br className="hidden lg:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-rose-400">
                                    Massive Discounts.
                                </span>
                            </h2>
                            <p className="text-lg lg:text-xl font-medium text-white/80 leading-relaxed max-w-md">
                                Join the movement to eliminate food waste on campus.
                                Rescue high-quality surplus food from your favorite
                                vendors at half the price.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Right side: Role Selector */}
            <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 py-16 lg:px-16 xl:px-24 bg-gray-50/50 relative">
                {/* Subtle background decoration */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-md mx-auto relative z-10"
                >
                    <motion.div variants={itemVariants} className="mb-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B00] to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF6B00]/20 mb-6">
                            <Utensils className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="font-display font-black text-4xl lg:text-5xl tracking-tight text-gray-900 mb-4">
                            Welcome to <br/>DealPlate
                        </h1>
                        <p className="text-gray-500 text-lg">
                            Select your role to get started with the platform.
                        </p>
                    </motion.div>

                    <div className="flex flex-col gap-5">
                        <Link href="/student/explore" passHref legacyBehavior>
                            <motion.a
                                variants={itemVariants}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative flex items-center w-full p-6 bg-white border-2 border-gray-100 hover:border-[#FF6B00]/30 rounded-3xl transition-all shadow-sm hover:shadow-xl hover:shadow-[#FF6B00]/10 overflow-hidden cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-rose-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative flex items-center w-full">
                                <div className="w-14 h-14 bg-orange-50 text-[#FF6B00] rounded-2xl flex items-center justify-center mr-5 group-hover:scale-110 group-hover:bg-[#FF6B00] group-hover:text-white transition-all duration-300 shadow-sm">
                                    <Utensils className="w-6 h-6" />
                                </div>
                                <div className="text-left flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                        I am a Student
                                    </h3>
                                    <p className="text-sm text-gray-500 font-medium group-hover:text-gray-700 transition-colors">
                                        Discover and buy discounted meals
                                    </p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-sm">
                                    <ArrowRight className="w-4 h-4 text-[#FF6B00]" />
                                </div>
                            </div>
                            </motion.a>
                        </Link>

                        <Link href="/vendor/sign-in" passHref legacyBehavior>
                            <motion.a
                                variants={itemVariants}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative flex items-center w-full p-6 bg-white border-2 border-gray-100 hover:border-gray-900/30 rounded-3xl transition-all shadow-sm hover:shadow-xl hover:shadow-gray-900/10 overflow-hidden cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="relative flex items-center w-full">
                                <div className="w-14 h-14 bg-gray-50 text-gray-900 rounded-2xl flex items-center justify-center mr-5 group-hover:scale-110 group-hover:bg-gray-900 group-hover:text-white transition-all duration-300 shadow-sm">
                                    <Store className="w-6 h-6" />
                                </div>
                                <div className="text-left flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                        I am a Vendor
                                    </h3>
                                    <p className="text-sm text-gray-500 font-medium group-hover:text-gray-700 transition-colors">
                                        List surplus food & increase revenue
                                    </p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-sm">
                                    <ArrowRight className="w-4 h-4 text-gray-900" />
                                </div>
                            </div>
                            </motion.a>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
