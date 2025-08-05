import {
  BookOpen,
  GraduationCap,
  X,
  Play,
  User,
  Menu,
  Search,
  Filter,
  Star,
  Clock,
  Users,
  LogOut,
  Info,
  CheckCircle,
  Eye,
  FileText,
  Shield,
  Download,
  Calendar,
  Award,
  Bookmark,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

function UserDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userName, setUserName] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // all, enrolled, pdf, video

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/courses");
        setCourses(res.data);
      } catch (err) {
        console.error("Error fetching courses", err);
      }
    };
    const fetchUser = () => {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setUserName(decoded.name);
      }
    };
    const fetchEnrolled = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await axios.get("http://localhost:5000/api/my-courses", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setEnrolledCourses(res.data);
        } catch {
          setEnrolledCourses([]);
        }
      }
    };
    fetchUser();
    fetchCourses();
    fetchEnrolled();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleEnroll = async (courseId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        "http://localhost:5000/api/enroll",
        { course_id: courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh enrolled courses
      const res = await axios.get("http://localhost:5000/api/my-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrolledCourses(res.data);
      // Switch to enrolled tab after successful enrollment
      setActiveTab("enrolled");
    } catch {
      alert("Enrollment failed.");
    }
  };

  const isEnrolled = (courseId) =>
    enrolledCourses.some((c) => c.id === courseId);

  // Filter logic
  const categories = ["All", ...new Set(courses.map((c) => c.category))];
  const filteredCourses = courses.filter(
    (course) =>
      (category === "All" || course.category === category) &&
      course.title.toLowerCase().includes(search.toLowerCase())
  );

  // Separate enrolled courses by content type
  const coursesWithPDF = enrolledCourses.filter((course) => course.pdfUrl);
  const coursesWithVideo = enrolledCourses.filter((course) => course.videoUrl);

  const renderContent = () => {
    switch (activeTab) {
      case "all":
        return (
          <div className="px-6">
            <h2 className="text-xl font-bold mb-4 flex items-center ">
              <BookOpen className="h-5 w-5 mr-2 text-indigo-600" />
              All Available Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.length === 0 && (
                <div className="col-span-full text-center text-gray-500">
                  No courses found.
                </div>
              )}
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden group"
                >
                  {/* Course Image/Thumbnail */}
                  <div className="relative">
                    <div className="aspect-video bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-t-2xl"></div>
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-indigo-700 text-xs font-semibold rounded-full shadow-sm">
                        {course.category}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs font-semibold text-gray-700 ml-1">
                          {course.rating || "N/A"}
                        </span>
                      </div>
                    </div>
                    {isEnrolled(course.id) && (
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-sm flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Enrolled
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Course Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {course.description}
                    </p>
                    {/* Instructor Info */}
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {course.instructor_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {course.instructor_name}
                        </p>
                        <p className="text-xs text-gray-500">Instructor</p>
                      </div>
                    </div>
                    Course Stats
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {course.duration}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        {course.studentCount || 0} students
                      </div>
                    </div>
                    Price and Action
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-3xl font-bold text-gray-900">
                          ₹{course.price}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          /course
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 ">
                        {isEnrolled(course.id) ? (
                          <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Enrolled
                          </button>
                        ) : (
                          // <button
                          //   className="w-full sm:w-auto text-black bg-blue-400 px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:bg-red-600"
                          //   onClick={() => handleEnroll(course.id)}
                          // >
                          //   Enroll Now
                          // </button>
                          <button
                            className="w-full sm:w-auto bg-blue-600 text-white px-2 py-1.5 sm:px-5 sm:py-1.5 rounded-md text-sm font-medium shadow hover:bg-blue-700 transition-all duration-200"
                            onClick={() => handleEnroll(course.id)}
                          >
                            Enroll Now
                          </button>
                        )}
                        <button
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          onClick={() => setSelectedCourse(course)}
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enrollment Section at Bottom */}
            <div className="mt-16 bg-blue-100 rounded-3xl p-8 text-black">
              <div className="text-center max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">
                  Ready to Start Your Learning Journey?
                </h2>
                <p className="text-xl text-black mb-8">
                  Join thousands of students who are already learning and
                  growing with our courses. Enroll today and unlock your
                  potential!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8  ">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Expert Instructors
                    </h3>
                    <p className="text-black">
                      Learn from industry professionals
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Video & PDF Content
                    </h3>
                    <p className="text-black">
                      Multiple learning formats available
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Certificate Ready
                    </h3>
                    <p className="text-black">Get certified upon completion</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="mt-16 bg-blue-100 text-white rounded-3xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <div className="flex items-center mb-4">
                    <GraduationCap className="h-8 w-8 text-black" />
                    <span className="ml-2 text-xl font-bold text-black">
                      SkillNova
                    </span>
                  </div>
                  <p className="text-black mb-4">
                    Empowering students with quality education and innovative
                    learning experiences.
                  </p>
                  <div className="flex space-x-4">
                    <a
                      href="#"
                      className="text-black hover:text-white transition-colors"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                      </svg>
                    </a>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-black transition-colors"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                      </svg>
                    </a>
                    <a
                      href="#"
                      className="text-black hover:text-grey-400 transition-colors"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-black">
                    Quick Links
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="#"
                        className="text-black hover:text-white transition-colors"
                      >
                        All Courses
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-black hover:text-white transition-colors"
                      >
                        My Learning
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-black hover:text-white transition-colors"
                      >
                        Certificates
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-black hover:text-white transition-colors"
                      >
                        Help Center
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text black text-black">
                    Support
                  </h3>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="#"
                        className="text-black hover:text-white transition-colors"
                      >
                        Contact Us
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-black hover:text-white transition-colors"
                      >
                        FAQ
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-black hover:text-white transition-colors"
                      >
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-black hover:text-white transition-colors"
                      >
                        Terms of Service
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-black">
                    Newsletter
                  </h3>
                  <p className="text-black mb-4">
                    Stay updated with our latest courses and learning tips.
                  </p>
                  <div className="flex">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 px-3 py-2 bg-gray-800 text-black rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button className="px-4 py-2 bg-indigo-600 text-black rounded-r-lg hover:bg-indigo-700 transition-colors">
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 mt-8 pt-8 text-center">
                <p className="text-black">
                  © 2024 Learning Portal. All rights reserved. Made with ❤️ for
                  education.
                </p>
              </div>
            </footer>
          </div>
        );

      case "enrolled":
        return (
          <div className="px-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              My Enrolled Courses ({enrolledCourses.length})
            </h2>
            {enrolledCourses.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  No enrolled courses yet
                </p>
                <p className="text-gray-400">
                  Enroll in courses to start learning!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        {course.category}
                      </span>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {course.description}
                    </p>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        Enrolled:{" "}
                        {new Date(course.enrolled_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-2" />
                        Duration: {course.duration}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="h-4 w-4 mr-2" />
                        Instructor: {course.instructor_name}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {course.pdfUrl && (
                        <a
                          href={`http://localhost:5000/${course.pdfUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          PDF
                        </a>
                      )}
                      {course.videoUrl && (
                        <button
                          onClick={() => setSelectedCourse(course)}
                          className="flex items-center bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Video
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "pdf":
        return (
          <div className="px-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              PDF Materials ({coursesWithPDF.length})
            </h2>
            {coursesWithPDF.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No PDF materials available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coursesWithPDF.map((course) => (
                  <div
                    key={course.id}
                    className="bg-blue-50 border border-blue-200 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {course.category}
                      </span>
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {course.instructor_name}
                      </span>
                      <a
                        href={`http://localhost:5000/${course.pdfUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download PDF
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "video":
        return (
          <div className="px-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Play className="h-5 w-5 mr-2 text-purple-600" />
              Video Lectures ({coursesWithVideo.length})
            </h2>
            {coursesWithVideo.length === 0 ? (
              <div className="text-center py-10">
                <Play className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No video lectures available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coursesWithVideo.map((course) => (
                  <div
                    key={course.id}
                    className="bg-purple-50 border border-purple-200 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                        {course.category}
                      </span>
                      <Play className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {course.description}
                    </p>
                    <div className="mb-4">
                      <video
                        width="100%"
                        controls
                        className="rounded-lg border"
                      >
                        <source
                          src={`http://localhost:5000/${course.videoUrl}`}
                          type="video/mp4"
                        />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {course.instructor_name}
                      </span>
                      <span className="text-sm text-gray-500">
                        Duration: {course.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="flex bg-blue-100">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-100 shadow-lg transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
        >
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-semibold">SkillNova</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-6 px-3">
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab("all")}
                className={`w-full text-left flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "all"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <BookOpen className="mr-3 h-5 w-5" />
                All Courses
              </button>
              <button
                onClick={() => setActiveTab("enrolled")}
                className={`w-full text-left flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "enrolled"
                    ? "bg-green-50 text-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <CheckCircle className="mr-3 h-5 w-5" />
                My Courses ({enrolledCourses.length})
              </button>
              <button
                onClick={() => setActiveTab("pdf")}
                className={`w-full text-left flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "pdf"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FileText className="mr-3 h-5 w-5" />
                PDF Materials ({coursesWithPDF.length})
              </button>
              <button
                onClick={() => setActiveTab("video")}
                className={`w-full text-left flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === "video"
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Play className="mr-3 h-5 w-5" />
                Video Lectures ({coursesWithVideo.length})
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:bg-gray-50 w-full flex items-center px-3 py-2 text-sm font-medium rounded-md"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:ml-0">
          {/* Topbar */}
          <div className="bg-blue-100 shadow-sm border-b">
            <div className="px-6 py-4 flex justify-between items-center">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mr-4"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Welcome, {userName}
                </h1>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="px-6 py-8 bg-blue-100 rounded-b-3xl shadow mb-8">
            <h2 className="text-3xl font-bold text-black mb-2">
              One Platform. Infinite Possibilities.
            </h2>
            <p className="text-gray-700 text-lg">
              Learn smarter, grow faster, and achieve more with hands-on
              learning experiences.
              <br />
              <span className="text-black font-semibold">
                Don’t Just Learn. Get Certified. Get Hired.{" "}
              </span>
            </p>
          </div>

          {/* Search and Filter - Only show for All Courses tab */}
          {activeTab === "all" && (
            <div className="px-6 flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex items-center border rounded px-2 w-full md:w-1/3 bg-white">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="outline-none px-2 py-1 w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center border rounded px-2 w-full md:w-1/4 bg-white">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  className="outline-none px-2 py-1 w-full"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Content based on active tab */}
          {renderContent()}

          {/* Course Details Modal */}
          {selectedCourse && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedCourse(null)}
                >
                  <X className="h-6 w-6" />
                </button>
                <h2 className="text-xl font-bold mb-2">
                  {selectedCourse.title}
                </h2>
                <p className="mb-2">{selectedCourse.description}</p>
                <p className="text-sm text-gray-500 mb-2">
                  Category: {selectedCourse.category}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  Instructor: {selectedCourse.instructor_name}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  Duration: {selectedCourse.duration}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  Price: ₹{selectedCourse.price}
                </p>
                <div className="flex items-center mb-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-1">
                    {selectedCourse.rating || "N/A"}
                  </span>
                </div>
                {selectedCourse.pdfUrl && (
                  <a
                    href={`http://localhost:5000/${selectedCourse.pdfUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center text-indigo-600 hover:underline mb-2"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View PDF
                  </a>
                )}
                {selectedCourse.videoUrl && (
                  <div className="mb-2">
                    <video width="100%" controls className="rounded-lg border">
                      <source
                        src={`http://localhost:5000/${selectedCourse.videoUrl}`}
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
