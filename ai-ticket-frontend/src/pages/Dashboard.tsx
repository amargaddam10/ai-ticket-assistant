// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   TicketIcon,
//   ClockIcon,
//   UserGroupIcon,
//   CheckCircleIcon,
//   ExclamationTriangleIcon,
//   ChevronUpIcon,
//   ChevronDownIcon,
//   SparklesIcon,
//   BellIcon,
//   PlusIcon,
//   CalendarIcon,
//   EyeIcon,
// } from '@heroicons/react/24/outline';
// import { useAppSelector, useAppDispatch } from '../store/store';
// import { fetchTickets } from '../store/slices/ticketSlice';
// import { toast } from 'react-hot-toast';
// import NotificationCenter from '../components/notifications/NotificationCenter';
// import CreateTicketModal from '../components/tickets/CreateTicketModal';
// import api from '../services/api';

// interface DashboardStats {
//   totalTickets: number;
//   openTickets: number;
//   inProgressTickets: number;
//   resolvedTickets: number;
//   closedTickets: number;
//   userTickets: number;
//   assignedToUser: number;
//   avgResolutionTime: number;
//   todayCreated: number;
//   todayResolved: number;
//   overdue: number;
// }

// interface AIInsight {
//   id: string;
//   type: 'trend' | 'recommendation' | 'alert' | 'prediction';
//   title: string;
//   description: string;
//   confidence: number;
//   actionable: boolean;
//   priority: 'low' | 'medium' | 'high' | 'urgent';
//   suggestion?: string;
// }

// interface RecentTicket {
//   _id: string;
//   title: string;
//   description: string;
//   status: string;
//   priority: string;
//   category: string;
//   createdAt: string;
//   user: {
//     name: string;
//     email: string;
//   };
// }

// const Dashboard: React.FC = () => {
//   const [stats, setStats] = useState<DashboardStats | null>(null);
//   // AI Insights moved to Profile page
//   const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [statsLoading, setStatsLoading] = useState(false);
//   const [insightsLoading, setInsightsLoading] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [showCreateTicket, setShowCreateTicket] = useState(false);
//   const [showAIModal, setShowAIModal] = useState(false);
//   const [selectedTicket, setSelectedTicket] = useState<any>(null);

//   // Add these new states after your existing ones
//   const [expandedTickets, setExpandedTickets] = useState<Set<string>>(
//     new Set()
//   );
//   const [showAllTickets, setShowAllTickets] = useState(false);
//   const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
//     new Set(['latest-tickets'])
//   );

//   const dispatch = useAppDispatch();
//   const { user } = useAppSelector((state) => state.auth);
//   const { tickets } = useAppSelector((state) => state.tickets);
//   const unreadCount = useAppSelector(
//     (state) => state.notifications?.unreadCount || 0
//   );

//   // Load dashboard data
//   useEffect(() => {
//     loadDashboardData();
//   }, []);

//   const loadDashboardData = async () => {
//     setLoading(true);
//     try {
//       await Promise.all([fetchDashboardStats(), fetchRecentTickets()]);
//     } catch (error) {
//       console.error('Failed to load dashboard:', error);
//       toast.error('Failed to load dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchDashboardStats = async () => {
//     setStatsLoading(true);
//     try {
//       const response = await api.get('/analytics/dashboard-stats');
//       setStats(response.data);
//     } catch (error) {
//       console.error('Failed to fetch stats:', error);
//       // Fallback to API calls for individual stats
//       try {
//         const [totalRes, openRes, inProgressRes, resolvedRes, userTicketsRes] =
//           await Promise.all([
//             api.get('/tickets/count'),
//             api.get('/tickets/count?status=open'),
//             api.get('/tickets/count?status=in-progress'),
//             api.get('/tickets/count?status=resolved'),
//             api.get(`/tickets/count?user=${user?._id}`),
//           ]);

//         setStats({
//           totalTickets: totalRes.data.count || 0,
//           openTickets: openRes.data.count || 0,
//           inProgressTickets: inProgressRes.data.count || 0,
//           resolvedTickets: resolvedRes.data.count || 0,
//           closedTickets: 0,
//           userTickets: userTicketsRes.data.count || 0,
//           assignedToUser: 0,
//           avgResolutionTime: 2.4,
//           todayCreated: 0,
//           todayResolved: 0,
//           overdue: 0,
//         });
//       } catch (fallbackError) {
//         console.error('Fallback stats error:', fallbackError);
//         // Set zero stats if everything fails
//         setStats({
//           totalTickets: 0,
//           openTickets: 0,
//           inProgressTickets: 0,
//           resolvedTickets: 0,
//           closedTickets: 0,
//           userTickets: 0,
//           assignedToUser: 0,
//           avgResolutionTime: 0,
//           todayCreated: 0,
//           todayResolved: 0,
//           overdue: 0,
//         });
//       }
//     } finally {
//       setStatsLoading(false);
//     }
//   };

//   const fetchRecentTickets = async () => {
//     try {
//       const response = await api.get('/tickets', {
//         params: {
//           limit: 10,
//           sortBy: 'createdAt',
//           sortDir: 'desc',
//         },
//       });

//       // Handle different response formats
//       let tickets =
//         response.data.tickets ||
//         response.data.data?.tickets ||
//         response.data ||
//         [];
//       tickets = Array.isArray(tickets) ? tickets : [];

//       // Show latest 3 tickets. For regular users, restrict to their created tickets.
//       const userId = (user as any)?.id || (user as any)?._id;
//       const isMine = (t: any) => {
//         const createdBy = t?.createdBy;
//         const userField = t?.user;
//         const createdById =
//           typeof createdBy === 'string' ? createdBy : createdBy?._id;
//         const userFieldId =
//           typeof userField === 'string' ? userField : userField?._id;
//         return createdById === userId || userFieldId === userId;
//       };
//       const filtered =
//         user?.role === 'admin' || user?.role === 'moderator'
//           ? tickets
//           : tickets.filter(isMine);
//       setRecentTickets(filtered.slice(0, 3));
//     } catch (error: any) {
//       console.error('Failed to fetch recent tickets:', error);

//       // Set empty array on error instead of crashing
//       setRecentTickets([]);

//       // Only show toast for non-404 errors
//       if (error.response?.status !== 404) {
//         toast.error('Unable to load recent tickets');
//       }
//     }
//   };

//   // AI Insights removed from dashboard

//   const parseAIResponse = (aiResponse: string): AIInsight[] => {
//     // Try to extract JSON from AI response
//     const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
//     if (jsonMatch) {
//       return JSON.parse(jsonMatch[0]);
//     }

//     // If no JSON, create structured insights from text
//     const insights: AIInsight[] = [];
//     const lines = aiResponse.split('\n').filter((line) => line.trim());

//     let currentInsight: Partial<AIInsight> = {};
//     lines.forEach((line, index) => {
//       if (
//         line.includes('1.') ||
//         line.includes('2.') ||
//         line.includes('3.') ||
//         line.includes('4.')
//       ) {
//         if (currentInsight.title) {
//           insights.push(currentInsight as AIInsight);
//         }
//         currentInsight = {
//           id: `ai-${index}`,
//           type: 'recommendation',
//           title: line.replace(/^\d+\.\s*/, '').trim(),
//           confidence: 0.85,
//           actionable: true,
//           priority: 'medium',
//         };
//       } else if (line.trim() && currentInsight.title) {
//         currentInsight.description = line.trim();
//       }
//     });

//     if (currentInsight.title) {
//       insights.push(currentInsight as AIInsight);
//     }

//     return insights;
//   };

//   const toggleTicketExpansion = (ticketId: string) => {
//     const newExpanded = new Set(expandedTickets);
//     if (newExpanded.has(ticketId)) {
//       newExpanded.delete(ticketId);
//     } else {
//       newExpanded.add(ticketId);
//     }
//     setExpandedTickets(newExpanded);
//   };

//   const toggleSection = (sectionId: string) => {
//     const newCollapsed = new Set(collapsedSections);
//     if (newCollapsed.has(sectionId)) {
//       newCollapsed.delete(sectionId);
//     } else {
//       newCollapsed.add(sectionId);
//     }
//     setCollapsedSections(newCollapsed);
//   };

//   const getPriorityColor = (priority: string) => {
//     switch (priority) {
//       case 'urgent':
//         return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
//       case 'high':
//         return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400';
//       case 'medium':
//         return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
//       case 'low':
//         return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
//       default:
//         return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-400';
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'open':
//         return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
//       case 'in-progress':
//         return <ClockIcon className="h-4 w-4 text-yellow-500" />;
//       case 'resolved':
//         return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
//       default:
//         return <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />;
//     }
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   // Removed mock insights

//   const handleCreateTicket = async (ticketData: any) => {
//     try {
//       // Create the ticket with minimal data - backend will set defaults
//       const response = await api.post('/tickets', {
//         title: ticketData.title,
//         description: ticketData.description,
//         // Backend will set default priority: medium, category: general, status: open
//       });

//       toast.success(
//         "Support ticket created successfully! We'll review it shortly."
//       );
//       setShowCreateTicket(false);

//       // ✅ NEW: Show AI response popup immediately after ticket creation
//       const createdTicket =
//         (response as any).data?.ticket ||
//         (response as any).data?.data?.ticket ||
//         (response as any).data;

//       if (
//         createdTicket &&
//         (createdTicket.aiResponse || createdTicket.aiNotes)
//       ) {
//         setSelectedTicket(createdTicket);
//         setShowAIModal(true); // Show the AI response modal immediately
//       }

//       // Trigger server-side AI processing for this ticket and cache locally for display
//       try {
//         if (createdTicket?.id) {
//           // Ask backend to process with AI and persist results on the ticket
//           try {
//             const aiProcessResponse = await api.post(
//               `/ai/process-ticket/${createdTicket.id}`
//             );

//             // ✅ If AI processing returns a response, show it immediately
//             if (
//               aiProcessResponse.data?.success &&
//               aiProcessResponse.data?.aiAnalysis
//             ) {
//               const updatedTicket = {
//                 ...createdTicket,
//                 aiResponse:
//                   aiProcessResponse.data.aiAnalysis.analysis ||
//                   aiProcessResponse.data.aiAnalysis.aiNotes,
//                 aiNotes: aiProcessResponse.data.aiAnalysis.aiNotes,
//               };
//               setSelectedTicket(updatedTicket);
//               setShowAIModal(true);
//             }
//           } catch (e) {
//             // Cache a readable output for immediate UX
//             const fallbackText = `Dear ${user?.name || 'User'},

// We are analyzing your ticket "${
//               createdTicket?.title || ticketData.title
//             }". You will see a detailed answer shortly.

// Meanwhile, you can check:
// - https://react.dev
// - https://developer.mozilla.org`;

//             localStorage.setItem(
//               'latestTicketOutput',
//               JSON.stringify({
//                 title: createdTicket?.title || ticketData.title,
//                 description:
//                   createdTicket?.description || ticketData.description,
//                 output: fallbackText,
//                 createdAt: createdTicket?.createdAt || new Date().toISOString(),
//               })
//             );

//             // ✅ Show the fallback response immediately
//             const fallbackTicket = {
//               ...createdTicket,
//               aiResponse: fallbackText,
//               title: createdTicket?.title || ticketData.title,
//               description: createdTicket?.description || ticketData.description,
//             };
//             setSelectedTicket(fallbackTicket);
//             setShowAIModal(true);
//           }
//         }
//       } catch (e) {
//         // Non-blocking if AI output generation fails
//       }

//       // Refresh dashboard data after a short delay
//       setTimeout(() => {
//         loadDashboardData();
//       }, 1000);
//     } catch (error: any) {
//       console.error('Create ticket error:', error);
//       const errorMessage =
//         error.response?.data?.message ||
//         'Failed to create ticket. Please try again.';
//       toast.error(errorMessage);
//     }
//   };

//   const getInsightIcon = (type: string) => {
//     switch (type) {
//       case 'trend':
//         return TicketIcon;
//       case 'recommendation':
//         return SparklesIcon;
//       case 'alert':
//         return ExclamationTriangleIcon;
//       case 'prediction':
//         return ClockIcon;
//       default:
//         return SparklesIcon;
//     }
//   };

//   const getInsightColor = (type: string) => {
//     switch (type) {
//       case 'trend':
//         return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
//       case 'recommendation':
//         return 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
//       case 'alert':
//         return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400';
//       case 'prediction':
//         return 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400';
//       default:
//         return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
//     }
//   };

//   const StatCard = ({
//     title,
//     value,
//     subtitle,
//     icon: Icon,
//     color,
//     change,
//     loading: cardLoading,
//   }: any) => (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
//     >
//       {cardLoading ? (
//         <div className="animate-pulse">
//           <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
//           <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
//           <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
//         </div>
//       ) : (
//         <div className="flex items-center justify-between">
//           <div className="flex-1">
//             <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
//               {title}
//             </p>
//             <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
//               {typeof value === 'number' ? value.toLocaleString() : value}
//             </p>
//             {subtitle && (
//               <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
//                 {subtitle}
//               </p>
//             )}
//             {change && (
//               <div
//                 className={`flex items-center mt-2 text-sm ${
//                   change > 0 ? 'text-green-600' : 'text-red-600'
//                 }`}
//               >
//                 {change > 0 ? (
//                   <ChevronUpIcon className="h-4 w-4 mr-1" />
//                 ) : (
//                   <ChevronDownIcon className="h-4 w-4 mr-1" />
//                 )}
//                 {Math.abs(change)}% vs last period
//               </div>
//             )}
//           </div>
//           <div className={`p-3 rounded-full ${color}`}>
//             <Icon className="h-6 w-6 text-white" />
//           </div>
//         </div>
//       )}
//     </motion.div>
//   );

//   if (loading) {
//     return (
//       <div className="space-y-6">
//         <div className="flex justify-between items-center">
//           <div className="animate-pulse">
//             <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
//             <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-80"></div>
//           </div>
//         </div>

//         {/* Loading skeleton for stats */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//           {[...Array(4)].map((_, i) => (
//             <div
//               key={i}
//               className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
//             >
//               <div className="animate-pulse">
//                 <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
//                 <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
//                 <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Loading skeleton for other sections */}
//         {[...Array(2)].map((_, i) => (
//           <div
//             key={i}
//             className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
//           >
//             <div className="animate-pulse">
//               <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
//               <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
//             </div>
//           </div>
//         ))}
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//             Welcome back, {user?.name || 'User'}!
//           </h1>
//           <p className="mt-2 text-gray-600 dark:text-gray-400">
//             Here's what's happening with your tickets today.
//           </p>
//         </div>

//         <div className="mt-4 sm:mt-0 flex items-center space-x-4">
//           {/* Create Ticket Button */}
//           <button
//             onClick={() => setShowCreateTicket(true)}
//             className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
//           >
//             <PlusIcon className="h-4 w-4 mr-2" />
//             Create Ticket
//           </button>

//           {/* Notifications */}
//           <button
//             onClick={() => setShowNotifications(true)}
//             className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
//           >
//             <BellIcon className="h-6 w-6" />
//             {unreadCount > 0 && (
//               <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
//                 {unreadCount > 9 ? '9+' : unreadCount}
//               </span>
//             )}
//           </button>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Total Tickets"
//           value={stats?.totalTickets || 0}
//           icon={TicketIcon}
//           color="bg-blue-500"
//           loading={statsLoading}
//         />
//         <StatCard
//           title="Open Tickets"
//           value={stats?.openTickets || 0}
//           subtitle={`${stats?.userTickets || 0} created by you`}
//           icon={ExclamationTriangleIcon}
//           color="bg-orange-500"
//           loading={statsLoading}
//         />
//         <StatCard
//           title="In Progress"
//           value={stats?.inProgressTickets || 0}
//           subtitle={`${stats?.assignedToUser || 0} assigned to you`}
//           icon={ClockIcon}
//           color="bg-yellow-500"
//           loading={statsLoading}
//         />
//         <StatCard
//           title="Resolved"
//           value={stats?.resolvedTickets || 0}
//           subtitle={`Avg: ${stats?.avgResolutionTime || 0}h`}
//           icon={CheckCircleIcon}
//           color="bg-green-500"
//           loading={statsLoading}
//         />
//       </div>

//       {/* Latest Ticket Output - Collapsible */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
//       >
//         <div
//           className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-200 dark:border-gray-700"
//           onClick={() => toggleSection('latest-tickets')}
//         >
//           <div>
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
//               Latest Ticket Output
//             </h3>
//             {/* <p className="text-sm text-gray-600 dark:text-gray-400">
//               Recent tickets with AI responses ({recentTickets.length} total)
//             </p> */}
//           </div>
//           <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors">
//             {collapsedSections.has('latest-tickets') ? (
//               <ChevronDownIcon className="h-5 w-5 text-gray-500" />
//             ) : (
//               <ChevronUpIcon className="h-5 w-5 text-gray-500" />
//             )}
//           </button>
//         </div>

//         <AnimatePresence>
//           {!collapsedSections.has('latest-tickets') && (
//             <motion.div
//               initial={{ height: 0, opacity: 0 }}
//               animate={{ height: 'auto', opacity: 1 }}
//               exit={{ height: 0, opacity: 0 }}
//               transition={{ duration: 0.3, ease: 'easeInOut' }}
//               className="overflow-hidden"
//             >
//               <div className="p-6">
//                 {(() => {
//                   const currentUserId = (user as any)?.id || (user as any)?._id;
//                   const latest =
//                     user?.role === 'admin' || user?.role === 'moderator'
//                       ? recentTickets[0]
//                       : recentTickets.find((t) => {
//                           const cb = (t as any).createdBy;
//                           const u = (t as any).user;
//                           const cbId = typeof cb === 'string' ? cb : cb?._id;
//                           const uId = typeof u === 'string' ? u : u?._id;
//                           return (
//                             cbId === currentUserId || uId === currentUserId
//                           );
//                         });

//                   let cached: any = null;
//                   try {
//                     const raw = localStorage.getItem('latestTicketOutput');
//                     if (raw) cached = JSON.parse(raw);
//                   } catch {}

//                   if (!latest && !cached) {
//                     return (
//                       <div className="text-center py-8">
//                         <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                         <p className="text-gray-600 dark:text-gray-400">
//                           No recent tickets with AI output. Create one to get
//                           started!
//                         </p>
//                       </div>
//                     );
//                   }

//                   const displayTickets = showAllTickets
//                     ? recentTickets.filter((t) => {
//                         if (
//                           user?.role === 'admin' ||
//                           user?.role === 'moderator'
//                         )
//                           return true;
//                         const cb = (t as any).createdBy;
//                         const u = (t as any).user;
//                         const cbId = typeof cb === 'string' ? cb : cb?._id;
//                         const uId = typeof u === 'string' ? u : u?._id;
//                         return cbId === currentUserId || uId === currentUserId;
//                       })
//                     : [latest].filter(Boolean);

//                   return (
//                     <div className="space-y-4">
//                       {displayTickets.map((ticket) => (
//                         <motion.div
//                           key={ticket._id}
//                           layout
//                           className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden hover:shadow-md transition-shadow ticket-card"
//                         >
//                           {/* Ticket Header - Always Visible */}
//                           <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
//                             <div className="flex items-start justify-between">
//                               <div className="flex-1 min-w-0">
//                                 <div className="flex items-center space-x-2 mb-2">
//                                   {getStatusIcon(ticket.status)}
//                                   <h4 className="font-medium text-gray-900 dark:text-white truncate">
//                                     {ticket.title}
//                                   </h4>
//                                   <span
//                                     className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
//                                       ticket.priority
//                                     )}`}
//                                   >
//                                     {ticket.priority}
//                                   </span>
//                                 </div>
//                                 <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
//                                   <div className="flex items-center space-x-1">
//                                     <CalendarIcon className="h-3 w-3" />
//                                     <span>{formatDate(ticket.createdAt)}</span>
//                                   </div>
//                                   <div className="flex items-center space-x-1">
//                                     <UserGroupIcon className="h-3 w-3" />
//                                     <span>
//                                       {ticket.user?.name || 'Unknown'}
//                                     </span>
//                                   </div>
//                                 </div>
//                               </div>
//                               <button
//                                 onClick={() =>
//                                   toggleTicketExpansion(ticket._id)
//                                 }
//                                 className="ml-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
//                                 title={
//                                   expandedTickets.has(ticket._id)
//                                     ? 'Collapse'
//                                     : 'Expand'
//                                 }
//                               >
//                                 {expandedTickets.has(ticket._id) ? (
//                                   <ChevronUpIcon className="h-4 w-4 text-gray-500" />
//                                 ) : (
//                                   <ChevronDownIcon className="h-4 w-4 text-gray-500" />
//                                 )}
//                               </button>
//                             </div>
//                           </div>

//                           {/* Expandable Content */}
//                           <AnimatePresence>
//                             {expandedTickets.has(ticket._id) && (
//                               <motion.div
//                                 initial={{ height: 0, opacity: 0 }}
//                                 animate={{ height: 'auto', opacity: 1 }}
//                                 exit={{ height: 0, opacity: 0 }}
//                                 transition={{
//                                   duration: 0.2,
//                                   ease: 'easeInOut',
//                                 }}
//                                 className="overflow-hidden bg-white dark:bg-gray-800"
//                               >
//                                 <div className="p-4 border-t border-gray-200 dark:border-gray-600">
//                                   <div className="space-y-4">
//                                     <div>
//                                       <h5 className="font-medium text-gray-900 dark:text-white mb-2">
//                                         Description:
//                                       </h5>
//                                       <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">
//                                         {ticket.description}
//                                       </p>
//                                     </div>

//                                     {((ticket as any).aiNotes ||
//                                       (ticket as any).aiResponse) && (
//                                       <div>
//                                         <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
//                                           🤖 AI Output:
//                                         </h5>
//                                         <div className="text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded border-l-4 border-blue-400 custom-scrollbar max-h-64 overflow-y-auto">
//                                           <div
//                                             dangerouslySetInnerHTML={{
//                                               __html: (
//                                                 (ticket as any).aiNotes ||
//                                                 (ticket as any).aiResponse ||
//                                                 ''
//                                               )
//                                                 .replace(/\n\n/g, '<br/><br/>')
//                                                 .replace(
//                                                   /(https?:\/\/[^\s)]+)|www\.[^\s)]+/g,
//                                                   (m) =>
//                                                     `<a href="${
//                                                       m.startsWith('http')
//                                                         ? m
//                                                         : 'https://' + m
//                                                     }" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300">${m}</a>`
//                                                 ),
//                                             }}
//                                           />
//                                         </div>
//                                       </div>
//                                     )}
//                                   </div>
//                                 </div>
//                               </motion.div>
//                             )}
//                           </AnimatePresence>
//                         </motion.div>
//                       ))}
//                     </div>
//                   );
//                 })()}
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.div>

//       {/* Recent Tickets */}
//       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
//         <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
//             Recent Tickets
//           </h3>
//         </div>
//         <div className="p-6">
//           {recentTickets.length === 0 ? (
//             <div className="text-center py-8">
//               <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//               <p className="text-gray-600 dark:text-gray-400">
//                 No recent tickets
//               </p>
//               <button
//                 onClick={() => setShowCreateTicket(true)}
//                 className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
//               >
//                 Create your first ticket
//               </button>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {recentTickets.map((ticket) => (
//                 <div
//                   key={ticket._id}
//                   className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
//                 >
//                   <div className="flex-1">
//                     <h4 className="font-medium text-gray-900 dark:text-white">
//                       {ticket.title}
//                     </h4>
//                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
//                       {ticket.description}
//                     </p>
//                     <div className="flex items-center space-x-4 mt-2">
//                       <span
//                         className={`px-2 py-1 text-xs rounded-full ${
//                           ticket.status === 'open'
//                             ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
//                             : ticket.status === 'in-progress'
//                             ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
//                             : ticket.status === 'resolved'
//                             ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
//                             : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
//                         }`}
//                       >
//                         {ticket.status}
//                       </span>
//                       <span
//                         className={`px-2 py-1 text-xs rounded-full ${
//                           ticket.priority === 'urgent'
//                             ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
//                             : ticket.priority === 'high'
//                             ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
//                             : ticket.priority === 'medium'
//                             ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
//                             : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
//                         }`}
//                       >
//                         {ticket.priority}
//                       </span>
//                       {ticket.category && (
//                         <span className="text-xs text-gray-500 dark:text-gray-400">
//                           {ticket.category}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                   <div className="ml-4 text-right flex-shrink-0">
//                     <p className="text-sm text-gray-600 dark:text-gray-400">
//                       {ticket.user?.name || 'Unknown User'}
//                     </p>
//                     <p className="text-xs text-gray-500 dark:text-gray-400">
//                       {new Date(ticket.createdAt).toLocaleDateString()}
//                     </p>
//                     {ticket.aiResponse && (
//                       <button
//                         onClick={() => {
//                           setSelectedTicket(ticket);
//                           setShowAIModal(true);
//                         }}
//                         className="mt-2 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors"
//                       >
//                         🤖 View AI Response
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Modals */}
//       <CreateTicketModal
//         isOpen={showCreateTicket}
//         onClose={() => setShowCreateTicket(false)}
//         onSubmit={handleCreateTicket}
//       />

//       <NotificationCenter
//         isOpen={showNotifications}
//         onClose={() => setShowNotifications(false)}
//       />

//       {/* AI Response Modal */}
//       {showAIModal && selectedTicket && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
//             {/* Header */}
//             <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
//                     <SparklesIcon className="w-5 h-5 text-purple-500" />
//                     <span className="ml-2">AI Analysis Complete</span>
//                   </h3>
//                   <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 font-medium">
//                     {selectedTicket.title}
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => setShowAIModal(false)}
//                   className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
//                 >
//                   <svg
//                     className="w-5 h-5"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth="2"
//                       d="M6 18L18 6M6 6l12 12"
//                     />
//                   </svg>
//                 </button>
//               </div>
//             </div>

//             {/* Content */}
//             <div className="p-6 overflow-y-auto max-h-[65vh]">
//               <div className="space-y-6">
//                 {/* Question */}
//                 <div>
//                   <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
//                     <TicketIcon className="w-4 h-4 text-gray-500" />
//                     <span className="ml-2">Your Question</span>
//                   </h4>
//                   <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border-l-4 border-gray-300 dark:border-gray-600">
//                     <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
//                       {selectedTicket.description}
//                     </p>
//                   </div>
//                 </div>

//                 {/* AI Response */}
//                 <div>
//                   <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
//                     <SparklesIcon className="w-4 h-4 text-purple-500" />
//                     <span className="ml-2">AI Generated Solution</span>
//                   </h4>
//                   <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border-l-4 border-blue-500">
//                     <div
//                       className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed"
//                       dangerouslySetInnerHTML={{
//                         __html: (
//                           selectedTicket.aiResponse ||
//                           (selectedTicket as any).aiNotes ||
//                           'AI analysis in progress...'
//                         )
//                           .replace(/\r\n/g, '\n')
//                           .replace(/\r/g, '\n')
//                           .replace(/\n\n/g, '<br/><br/>')
//                           .replace(/\n/g, '<br/>')
//                           .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
//                           .replace(/\*(.*?)\*/g, '<em>$1</em>')
//                           .replace(
//                             /`(.*?)`/g,
//                             '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>'
//                           )
//                           .replace(
//                             /(https?:\/\/[^\s)]+|www\.[^\s)]+)/g,
//                             (m) =>
//                               `<a href="${
//                                 m.startsWith('http') ? m : 'https://' + m
//                               }" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors">${m}</a>`
//                           )
//                           .replace(
//                             /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
//                             '<a href="mailto:$1" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors">$1</a>'
//                           ),
//                       }}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
//               <div className="flex justify-between items-center">
//                 <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
//                   <SparklesIcon className="w-3 h-3" />
//                   <span className="ml-1">
//                     You can view this response anytime in your Recent Tickets
//                   </span>
//                 </p>
//                 <button
//                   onClick={() => setShowAIModal(false)}
//                   className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-200 font-medium"
//                 >
//                   Got it!
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
// export default Dashboard;

import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/store';
import { fetchTickets } from '../store/slices/ticketSlice';
import CreateTicketModal from '../components/tickets/CreateTicketModal';
import NotificationCenter from '../components/notifications/NotificationCenter';
import api from '../services/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  userTickets: number;
  assignedToUser: number;
  avgResolutionTime: number;
}

interface RecentTicket {
  _id: string;
  id?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  user?: { name: string; email: string };
  createdBy?: { name: string; email: string };
  aiResponse?: string;
  aiNotes?: string;
}

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const unreadCount = useAppSelector(
    (state) => state.notifications?.unreadCount || 0
  );

  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 8,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 8,
    userTickets: 0,
    assignedToUser: 0,
    avgResolutionTime: 0,
  });
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDashboardStats(), fetchRecentTickets()]);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/analytics/dashboard-stats');
      setStats({
        totalTickets: response.data?.totalTickets || 0,
        openTickets: response.data?.openTickets || 0,
        inProgressTickets: response.data?.inProgressTickets || 0,
        resolvedTickets: response.data?.resolvedTickets || 0,
        userTickets: response.data?.userTickets || 0,
        assignedToUser: response.data?.assignedToUser || 0,
        avgResolutionTime: response.data?.avgResolutionTime || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Keep default stats that match your screenshot
    }
  };

  const fetchRecentTickets = async () => {
    try {
      const response = await api.get('/tickets', {
        params: { limit: 10, sortBy: 'createdAt', sortDir: 'desc' },
      });
      let tickets =
        response.data.tickets || response.data.data?.tickets || response.data;
      if (!Array.isArray(tickets)) tickets = [];
      setRecentTickets(tickets.slice(0, 3));
    } catch (error) {
      console.error('Failed to fetch recent tickets:', error);
      setRecentTickets([]);
    }
  };

  const handleCreateTicket = async (ticketData: any) => {
    try {
      console.log('🎫 Creating ticket with data:', ticketData);

      // Create the ticket
      const response = await api.post('/tickets', {
        title: ticketData.title,
        description: ticketData.description,
      });

      console.log('✅ Ticket created response:', response.data);

      toast.success(
        'Support ticket created successfully! AI is analyzing your question...'
      );
      setShowCreateTicket(false);

      // Get the created ticket from response
      const createdTicket =
        response.data?.ticket || response.data?.data?.ticket || response.data;

      if (createdTicket) {
        console.log('🎫 Created ticket:', createdTicket);

        // Wait a moment for AI processing to complete on backend
        setTimeout(async () => {
          try {
            // Fetch the updated ticket with AI response
            const ticketResponse = await api.get(
              `/tickets/${createdTicket.id}`
            );
            const updatedTicket =
              ticketResponse.data?.ticket ||
              ticketResponse.data?.data ||
              ticketResponse.data;

            console.log('🤖 Fetched ticket with AI response:', updatedTicket);

            if (
              updatedTicket &&
              (updatedTicket.aiResponse || updatedTicket.aiNotes)
            ) {
              console.log('✅ Showing AI popup with response');
              setSelectedTicket(updatedTicket);
              setShowAIModal(true);
            } else {
              console.log(
                '⚠️ No AI response found, trying backend AI processing'
              );

              // Trigger backend AI processing if not done yet
              try {
                const aiResponse = await api.post(
                  `/ai/process-ticket/${createdTicket.id}`
                );
                if (aiResponse.data?.success && aiResponse.data?.ticket) {
                  const processedTicket = aiResponse.data.ticket;
                  console.log(
                    '🤖 Backend AI processing completed:',
                    processedTicket
                  );
                  setSelectedTicket(processedTicket);
                  setShowAIModal(true);
                }
              } catch (aiError) {
                console.error('❌ Backend AI processing failed:', aiError);
              }
            }
          } catch (fetchError) {
            console.error('❌ Failed to fetch updated ticket:', fetchError);
          }
        }, 2000); // Wait 2 seconds for backend AI processing
      }

      // Refresh dashboard data
      setTimeout(() => {
        loadDashboardData();
      }, 3000);
    } catch (error: any) {
      console.error('❌ Create ticket error:', error);
      const errorMessage =
        error.response?.data?.message ||
        'Failed to create ticket. Please try again.';
      toast.error(errorMessage);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Get latest ticket for the Latest Ticket Output section
  const latestTicket = recentTickets.length > 0 ? recentTickets[0] : null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name || 'Admin'}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here's what's happening with your tickets today.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCreateTicket(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            + Create Ticket
          </button>
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards - Exact design from Screenshot-292 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tickets */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalTickets}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.openTickets}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.userTickets} created by you
              </p>
            </div>
            <div className="p-3 rounded-full bg-orange-500">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.inProgressTickets}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.assignedToUser} assigned to you
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-500">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.resolvedTickets}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {stats.avgResolutionTime}h
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Ticket Output */}
      <div className="bg-white rounded-lg shadow">
        <div
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors border-b"
          onClick={() => toggleSection('latest-tickets')}
        >
          <h3 className="text-lg font-semibold text-gray-900">
            Latest Ticket Output
          </h3>
          <svg
            className={`h-5 w-5 text-gray-500 transition-transform ${
              collapsedSections.has('latest-tickets') ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {!collapsedSections.has('latest-tickets') && (
          <div className="p-6">
            {!latestTicket ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  No recent tickets with AI output.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {latestTicket.title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        latestTicket.status === 'resolved'
                          ? 'bg-green-100 text-green-800'
                          : latestTicket.status === 'open'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {latestTicket.status}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        latestTicket.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {latestTicket.priority}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {latestTicket.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {latestTicket.createdBy?.name ||
                      latestTicket.user?.name ||
                      'Unknown'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span>{formatDate(latestTicket.createdAt)}</span>
                    {(latestTicket.aiResponse || latestTicket.aiNotes) && (
                      <button
                        onClick={() => {
                          setSelectedTicket(latestTicket);
                          setShowAIModal(true);
                        }}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      >
                        🤖 View AI Response
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Tickets
          </h3>
        </div>
        <div className="p-6">
          {recentTickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No recent tickets</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket._id || ticket.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {ticket.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {ticket.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          ticket.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : ticket.status === 'open'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ticket.status}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          ticket.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : ticket.priority === 'low'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm text-gray-600">
                      {ticket.createdBy?.name || ticket.user?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(ticket.createdAt)}
                    </p>
                    {(ticket.aiResponse || ticket.aiNotes) && (
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowAIModal(true);
                        }}
                        className="mt-2 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      >
                        🤖 View AI Response
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateTicketModal
        isOpen={showCreateTicket}
        onClose={() => setShowCreateTicket(false)}
        onSubmit={handleCreateTicket}
      />

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* AI Response Modal */}
      {showAIModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    🤖 AI Analysis Complete
                  </h3>
                  <p className="text-sm text-blue-600 mt-1 font-medium">
                    {selectedTicket.title}
                  </p>
                </div>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[65vh]">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    📋 Your Question
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">
                    <p className="text-gray-700">
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    🤖 AI Generated Solution
                  </h4>
                  <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-500">
                    <div
                      className="text-gray-700 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: (
                          selectedTicket.aiResponse ||
                          selectedTicket.aiNotes ||
                          'AI analysis in progress...'
                        )
                          .replace(/\n/g, '<br>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(
                            /(https?:\/\/[^\s]+)/g,
                            '<a href="$1" target="_blank" class="text-blue-600 underline">$1</a>'
                          ),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  🤖 You can view this response anytime
                </p>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
