import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BookOpen,
  GraduationCap,
  Upload,
  Users,
  Menu,
  X,
  Star,
  LogOut,
} from "lucide-react";

const InstructorDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const [currentSection, setCurrentSection] = useState("dashboard"); // Add this state
  const [formData, setFormData] = useState({
    title: "",
    category: "Programming",
    description: "",
    price: "",
    duration: "",
  });
  const [editingCourse, setEditingCourse] = useState(null);
  const [fileData, setFileData] = useState({ video: null, pdf: null });

  const token = localStorage.getItem("token");

  const fetchCourses = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/instructor/courses",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Ensure response is array
      if (Array.isArray(res.data)) {
        setCourses(res.data);
      } else {
        console.error("Courses is not an array:", res.data);
        setCourses([]);
      }
    } catch (err) {
      console.error("Failed to fetch courses", err);
      setCourses([]); // prevent crash
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/total-students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentsCount(res.data.total);
    } catch (err) {
      console.error("Failed to fetch student count", err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFileData({ ...fileData, [e.target.name]: e.target.files[0] });
  };

  const handleAddCourse = async () => {
    const { title, category, description, price, duration } = formData;
    // Require all fields
    if (!title || !category || !description || !price || !duration) {
      alert("All fields are required to publish the course.");
      return;
    }
    // Require at least one file
    if (!fileData.video && !fileData.pdf) {
      alert("At least one file (video or PDF) is required.");
      return;
    }

    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => form.append(key, value));
    if (fileData.video) form.append("video", fileData.video);
    if (fileData.pdf) form.append("pdf", fileData.pdf);

    try {
      await axios.post("http://localhost:5000/api/courses", form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setFormData({
        title: "",
        category: "Programming",
        description: "",
        price: "",
        duration: "",
      });
      setFileData({ video: null, pdf: null });
      fetchCourses();
      setCurrentSection("courses"); // Switch to courses section after adding
    } catch (err) {
      console.error("Course publish failed", err);
      alert("Something went wrong!");
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      category: course.category,
      description: course.description,
      price: course.price,
      duration: course.duration,
    });
    // Switch to upload section when editing
    setCurrentSection("upload");
  };

  const handleUpdateCourse = async () => {
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => form.append(key, value));
    if (fileData.video) form.append("video", fileData.video);
    if (fileData.pdf) form.append("pdf", fileData.pdf);

    try {
      await axios.put(
        `http://localhost:5000/api/courses/${editingCourse.id}`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setEditingCourse(null);
      setFormData({
        title: "",
        category: "Programming",
        description: "",
        price: "",
        duration: "",
      });
      setFileData({ video: null, pdf: null });
      fetchCourses();
    } catch (err) {
      console.error("Course update failed", err);
      alert("Something went wrong!");
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCourses();
    } catch (err) {
      console.error("Course delete failed", err);
      alert("Something went wrong!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Render different sections based on currentSection
  const renderSection = () => {
    switch (currentSection) {
      case "dashboard":
        return (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow p-6">
                <GraduationCap className="h-6 w-6 text-indigo-600 mb-2" />
                <p className="text-sm text-gray-500">Total Courses</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <Users className="h-6 w-6 text-green-600 mb-2" />
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold">{studentsCount}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <Star className="h-6 w-6 text-yellow-600 mb-2" />
                <p className="text-sm text-gray-500">Average Rating</p>
                <p className="text-2xl font-bold">4.5</p>
              </div>
            </div>

            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-400 to-purple-600 rounded-xl p-6 text-black">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Course Management</h2>
                  <p className="text-indigo-100">
                    Create and manage your educational content
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-indigo-200">
                    Welcome back, Instructor!
                  </p>
                  <p className="text-lg font-semibold">Ready to inspire?</p>
                </div>
              </div>
            </div>

            {/* Upload Course Section */}
            <div className="bg-blue-100 rounded-xl shadow border p-6">
              <h2 className="text-lg font-semibold mb-4">Upload New Course</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Course Title"
                  className="border p-2 rounded"
                />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="border p-2 rounded"
                >
                  <option>Programming</option>
                  <option>Database</option>
                  <option>Design</option>
                  <option>Marketing</option>
                </select>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description"
                  rows={3}
                  className="border p-2 rounded md:col-span-2"
                ></textarea>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Price"
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="Duration"
                  className="border p-2 rounded"
                />
                <input
                  type="file"
                  name="video"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="border p-2 rounded"
                />
                <input
                  type="file"
                  name="pdf"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="border p-2 rounded"
                />
              </div>
              <button
                onClick={editingCourse ? handleUpdateCourse : handleAddCourse}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                {editingCourse ? "Update Course" : "Publish Course"}
              </button>
            </div>

            {/* My Courses Section */}
            <div className="bg-blue-100 rounded-xl shadow border p-6">
              <h2 className="text-lg font-semibold mb-4">My Courses</h2>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Duration: {course.duration}
                      </p>
                      <p className="text-sm text-gray-600">
                        ₹{course.price} | {course.category}
                      </p>
                      <p className="text-sm text-yellow-600">
                        Rating:{" "}
                        {course.averageRating
                          ? course.averageRating.toFixed(1)
                          : "0.0"}
                      </p>
                      {course.videoUrl && (
                        <a
                          href={course.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Video
                        </a>
                      )}
                      {course.pdfUrl && (
                        <a
                          href={course.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline ml-2"
                        >
                          PDF
                        </a>
                      )}
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="px-3 py-1 text-sm border rounded text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <p className="text-center text-gray-500">No courses yet.</p>
                )}
              </div>
            </div>

            {/* Footer Section */}
            <div className="bg-blue-100 rounded-xl p-6 border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Quick Stats
                  </h3>
                  <p className="text-sm text-gray-600">
                    {courses.length} courses published
                  </p>
                  <p className="text-sm text-gray-600">
                    {studentsCount} students enrolled
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Support</h3>
                  <p className="text-sm text-gray-600">
                    Need help? Contact our team
                  </p>
                  <p className="text-sm text-indigo-600">faizkhan.com</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Resources
                  </h3>
                  <p className="text-sm text-gray-600">
                    Course creation guidelines
                  </p>
                  <p className="text-sm text-gray-600">
                    Best practices for instructors
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  © 2024 Faiz. All rights reserved.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Empowering educators to create amazing learning experiences
                </p>
              </div>
            </div>
          </div>
        );

      case "upload":
        return (
          <div className="space-y-10">
            {/* Upload Course Section */}
            <div className="bg-blue-100 rounded-xl shadow border p-6">
              <h2 className="text-lg font-semibold mb-4">Upload New Course</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Course Title"
                  className="border p-2 rounded"
                />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="border p-2 rounded"
                >
                  <option>Programming</option>
                  <option>Database</option>
                  <option>Design</option>
                  <option>Marketing</option>
                </select>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description"
                  rows={3}
                  className="border p-2 rounded md:col-span-2"
                ></textarea>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Price"
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="Duration"
                  className="border p-2 rounded"
                />
                <input
                  type="file"
                  name="video"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="border p-2 rounded"
                />
                <input
                  type="file"
                  name="pdf"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="border p-2 rounded"
                />
              </div>
              <button
                onClick={editingCourse ? handleUpdateCourse : handleAddCourse}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                {editingCourse ? "Update Course" : "Publish Course"}
              </button>
            </div>

            {/* My Courses Section */}
            <div className="bg-blue-100 rounded-xl shadow border p-6">
              <h2 className="text-lg font-semibold mb-4">My Courses</h2>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Duration: {course.duration}
                      </p>
                      <p className="text-sm text-gray-600">
                        ₹{course.price} | {course.category}
                      </p>
                      <p className="text-sm text-yellow-600">
                        Rating:{" "}
                        {course.averageRating
                          ? course.averageRating.toFixed(1)
                          : "0.0"}
                      </p>
                      {course.videoUrl && (
                        <a
                          href={course.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Video
                        </a>
                      )}
                      {course.pdfUrl && (
                        <a
                          href={course.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline ml-2"
                        >
                          PDF
                        </a>
                      )}
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="px-3 py-1 text-sm border rounded text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <p className="text-center text-gray-500">No courses yet.</p>
                )}
              </div>
            </div>
          </div>
        );

      case "courses":
        return (
          <div className="bg-blue-100 rounded-xl shadow border p-6">
            <h2 className="text-lg font-semibold mb-4">My Courses</h2>
            <div className="space-y-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Duration: {course.duration}
                    </p>
                    <p className="text-sm text-gray-600">
                      ₹{course.price} | {course.category}
                    </p>
                    <p className="text-sm text-yellow-600">
                      Rating:{" "}
                      {course.averageRating
                        ? course.averageRating.toFixed(1)
                        : "0.0"}
                    </p>
                    {course.videoUrl && (
                      <a
                        href={course.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Video
                      </a>
                    )}
                    {course.pdfUrl && (
                      <a
                        href={course.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline ml-2"
                      >
                        PDF
                      </a>
                    )}
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="px-3 py-1 text-sm border rounded text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <p className="text-center text-gray-500">No courses yet.</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-blue-100">
      <div className="flex">
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            ></div>
          </div>
        )}

        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-perple-50 shadow-lg transform ${
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
                onClick={() => setCurrentSection("dashboard")}
                className={`w-full text-left group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentSection === "dashboard"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-black hover:bg-gray-50"
                }`}
              >
                <GraduationCap className="mr-3 h-5 w-5" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentSection("courses")}
                className={`w-full text-left group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentSection === "courses"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-black hover:bg-gray-50"
                }`}
              >
                <BookOpen className="mr-3 h-5 w-5" />
                My Courses
              </button>
              <button
                onClick={() => setCurrentSection("upload")}
                className={`w-full text-left group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentSection === "upload"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-black hover:bg-gray-50"
                }`}
              >
                <Upload className="mr-3 h-5 w-5" />
                Upload Course
              </button>
              <button
                onClick={handleLogout}
                className="text-black hover:bg-gray-50 group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </nav>
        </div>

        <div className="flex-1 lg:ml-0">
          <div className="bg-blue-100 shadow-sm border-b">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden mr-4"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {currentSection === "dashboard" && "Instructor Dashboard"}
                    {currentSection === "courses" && "My Courses"}
                    {currentSection === "upload" && "Upload Course"}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-10">{renderSection()}</div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
