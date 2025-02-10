import React, { useState } from "react";
//import "./BrowsePage.css"; // OPTIONAL: If you prefer external CSS, otherwise inline below
import { useNavigate } from "react-router-dom";

/**
 * Modern 'Browse' Page
 * - Recommendations with progress & carousel
 * - Explore all categories with subcategories
 */
function BrowsePage() {
  const navigate = useNavigate();

  // Example progress stats for the user
  const userGoal = "30 hours";    // total goal
  const userCompleted = 12;       // hours completed
  // Calculate percentage completed
  const completionPercent = Math.round((userCompleted / parseInt(userGoal)) * 100);

  // Example recommended books data
  // Each item has a title, cover image, and possibly an ID or link
  const recommendedBooks = [
    {
      id: 1,
      title: "Learn AI Basics",
      cover: "https://via.placeholder.com/150x220/FFD700/000?text=AI+Basics",
    },
    {
      id: 2,
      title: "Math for Machine Learning",
      cover: "https://via.placeholder.com/150x220/FFD700/000?text=Math+ML",
    },
    {
      id: 3,
      title: "Neural Networks 101",
      cover: "https://via.placeholder.com/150x220/FFD700/000?text=Neural+Nets",
    },
    {
      id: 4,
      title: "Python Crash Course",
      cover: "https://via.placeholder.com/150x220/FFD700/000?text=Python+101",
    },
    {
      id: 5,
      title: "Data Science Handbook",
      cover: "https://via.placeholder.com/150x220/FFD700/000?text=Data+Science",
    },
  ];

  // Carousel state
  const [carouselIndex, setCarouselIndex] = useState(0);

  const handlePrevBook = () => {
    setCarouselIndex((prev) => (prev === 0 ? recommendedBooks.length - 1 : prev - 1));
  };

  const handleNextBook = () => {
    setCarouselIndex((prev) => (prev === recommendedBooks.length - 1 ? 0 : prev + 1));
  };

  // Categories and Subcategories
  const categories = [
    {
      name: "Anthropology",
      subcategories: ["Cultural Anthro", "Physical Anthro", "Linguistic Anthro"],
    },
    {
      name: "Biology",
      subcategories: ["Microbiology", "Genetics", "Botany", "Zoology"],
    },
    {
      name: "Physics",
      subcategories: ["Classical Mechanics", "Quantum Physics", "Relativity"],
    },
    {
      name: "Business & Marketing",
      subcategories: ["Finance", "Digital Marketing", "Entrepreneurship"],
    },
    {
      name: "Mathematics",
      subcategories: ["Algebra", "Calculus", "Statistics"],
    },
    {
      name: "History",
      subcategories: ["Ancient", "Medieval", "Modern"],
    },
    {
      name: "Art & Design",
      subcategories: ["Graphic Design", "Painting", "Photography"],
    },
    {
      name: "Philosophy",
      subcategories: ["Metaphysics", "Epistemology", "Ethics"],
    },
  ];

  // Track selected category/subcategory
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  // Placeholder: Books for subcategories
  // In real use, you'd fetch them from server or have separate data
  const subcategoryBooks = [
    {
      title: "Subcategory Book 1",
      cover: "https://via.placeholder.com/150x220/FFD700/000?text=Book+1",
    },
    {
      title: "Subcategory Book 2",
      cover: "https://via.placeholder.com/150x220/FFD700/000?text=Book+2",
    },
    {
      title: "Subcategory Book 3",
      cover: "https://via.placeholder.com/150x220/FFD700/000?text=Book+3",
    },
    {
      title: "Subcategory Book 4",
      cover: "https://via.placeholder.com/150x220/FFD700/000?text=Book+4",
    },
  ];

  // Handlers for navigation
  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedSubcategory(null);
  };

  const handleSubcategoryClick = (subcategoryName) => {
    setSelectedSubcategory(subcategoryName);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
        fontFamily: "'Open Sans', sans-serif",
        color: "#fff",
        padding: "30px",
      }}
    >
      {/* Title or Nav */}
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <h1 style={{ margin: 0 }}>Browse & Explore</h1>
      </div>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Recommendations Section */}
        <section
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <h2>Your Recommendations</h2>
          {/* User's Progress Row */}
          <div style={{ margin: "15px 0" }}>
            <p>
              You’ve completed <strong>{userCompleted}</strong> out of{" "}
              <strong>{userGoal}</strong> hours ({completionPercent}%).
            </p>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.3)",
                borderRadius: "8px",
                width: "100%",
                height: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${completionPercent}%`,
                  background: "#FFD700",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* Carousel of recommended books */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <button
              onClick={handlePrevBook}
              style={{
                background: "none",
                border: "2px solid #FFD700",
                color: "#FFD700",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              ‹
            </button>

            <div
              style={{
                width: "150px",
                height: "220px",
                backgroundColor: "#333",
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                overflow: "hidden",
                textAlign: "center",
                margin: "0 10px",
              }}
            >
              <img
                src={recommendedBooks[carouselIndex].cover}
                alt={recommendedBooks[carouselIndex].title}
                style={{ width: "100%", height: "auto" }}
              />
              <p style={{ padding: "5px 10px" }}>
                {recommendedBooks[carouselIndex].title}
              </p>
            </div>

            <button
              onClick={handleNextBook}
              style={{
                background: "none",
                border: "2px solid #FFD700",
                color: "#FFD700",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                cursor: "pointer",
                marginLeft: "10px",
              }}
            >
              ›
            </button>
          </div>
        </section>

        {/* Explore All Categories Section */}
        <section
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            borderRadius: "10px",
            padding: "20px",
          }}
        >
          <h2>Explore All Categories</h2>

          {/* If user hasn't selected a category yet */}
          {!selectedCategory && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "20px",
                marginTop: "20px",
              }}
            >
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  style={{
                    backgroundColor: "#333",
                    borderRadius: "8px",
                    textAlign: "center",
                    padding: "30px 10px",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <p style={{ margin: 0, fontWeight: "bold" }}>{cat.name}</p>
                </div>
              ))}
            </div>
          )}

          {/* If category is selected but no subcategory yet */}
          {selectedCategory && !selectedSubcategory && (
            <div style={{ marginTop: "20px" }}>
              <p style={{ marginBottom: "10px" }}>
                <span
                  style={{ cursor: "pointer", color: "#FFD700" }}
                  onClick={handleBackToCategories}
                >
                  All Categories
                </span>{" "}
                &gt; <strong>{selectedCategory}</strong>
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "15px",
                }}
              >
                {categories
                  .find((c) => c.name === selectedCategory)
                  ?.subcategories.map((subcat) => (
                    <div
                      key={subcat}
                      onClick={() => handleSubcategoryClick(subcat)}
                      style={{
                        backgroundColor: "#333",
                        borderRadius: "8px",
                        textAlign: "center",
                        padding: "20px",
                        cursor: "pointer",
                        flex: "1 0 200px",
                        transition: "transform 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "scale(1.05)")
                      }
                      onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <p style={{ margin: 0, fontWeight: "bold" }}>{subcat}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* If subcategory is selected, show books */}
          {selectedCategory && selectedSubcategory && (
            <div style={{ marginTop: "20px" }}>
              <p style={{ marginBottom: "10px" }}>
                <span
                  style={{ cursor: "pointer", color: "#FFD700" }}
                  onClick={handleBackToCategories}
                >
                  All Categories
                </span>{" "}
                &gt;{" "}
                <span
                  style={{ cursor: "pointer", color: "#FFD700" }}
                  onClick={() => {
                    // user is in a subcategory, so just go back to category view
                    setSelectedSubcategory(null);
                  }}
                >
                  {selectedCategory}
                </span>{" "}
                &gt; <strong>{selectedSubcategory}</strong>
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: "20px",
                }}
              >
                {subcategoryBooks.map((book, idx) => (
                  <div
                    key={`${selectedSubcategory}-${idx}`}
                    style={{
                      backgroundColor: "#333",
                      borderRadius: "8px",
                      overflow: "hidden",
                      textAlign: "center",
                      transition: "transform 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <img
                      src={book.cover}
                      alt={book.title}
                      style={{ width: "100%", height: "auto" }}
                    />
                    <p style={{ margin: "10px 0" }}>{book.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default BrowsePage;