// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  fetchSignInMethodsForEmail,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB2nnc9jrs1LSBjcS_YiU4463jXxrg5RzQ",
  authDomain: "webtask-cdf93.firebaseapp.com",
  projectId: "webtask-cdf93",
  storageBucket: "webtask-cdf93.firebasestorage.app",
  messagingSenderId: "215522660328",
  appId: "1:215522660328:web:933c5fd9784ea343bb9e5d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elements
const signupForm = document.getElementById("signup-container");
const signinForm = document.getElementById("signin-container");
const homeContainer = document.getElementById("home-container");

// Switch between Sign In and Sign Up
document.getElementById("show-signup").addEventListener("click", (e) => {
  e.preventDefault();
  signinForm.style.display = "none";
  signupForm.style.display = "flex";
});

document.getElementById("show-signin").addEventListener("click", (e) => {
  e.preventDefault();
  signupForm.style.display = "none";
  signinForm.style.display = "flex";
});

// Sign Up
document.getElementById("signup-btn").addEventListener("click", async (e) => {
  e.preventDefault();

  const username = document.getElementById("signup-username").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById(
    "signup-confirm-password"
  ).value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    if (signInMethods.length > 0) {
      alert("Email is already in use. Please use another email.");
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName: username });

    alert("Sign up successful! Please sign in.");

    await signOut(auth); // Important: Log out after signup

    signupForm.style.display = "none";
    signinForm.style.display = "flex";
    homeContainer.style.display = "none";
  } catch (error) {
    console.error("Sign up error:", error.message);
    alert("Error during sign up: " + error.message);
  }
});

// Sign In
document.getElementById("signin-btn").addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signin-email").value.trim();
  const password = document.getElementById("signin-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    signinForm.style.display = "none";
    homeContainer.style.display = "block";
    displayPosts();
  } catch (error) {
    console.error("Sign in error:", error.message);
    alert("Error during sign in: " + error.message);
  }
});

// Sign Out
document.getElementById("logout-btn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    homeContainer.style.display = "none";
    signinForm.style.display = "flex";
  } catch (error) {
    console.error("Sign out error:", error.message);
  }
});

// Add Post
document.getElementById("post-btn").addEventListener("click", async () => {
  const content = document.getElementById("post-content").value.trim();
  const user = auth.currentUser;

  if (!content) {
    alert("Post content cannot be empty!");
    return;
  }

  if (user) {
    try {
      await addDoc(collection(db, "posts"), {
        content: content,
        userId: user.uid,
        username: user.displayName || "Unknown",
        timestamp: serverTimestamp(),
      });
      document.getElementById("post-content").value = "";
      displayPosts();
    } catch (error) {
      console.error("Post error:", error.message);
    }
  }
});

// Display Posts
async function displayPosts() {
  const postsRef = collection(db, "posts");
  const q = query(postsRef, orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);

  const postsList = document.getElementById("posts");
  postsList.innerHTML = "";

  querySnapshot.forEach((docSnap) => {
    const post = docSnap.data();
    const postDiv = document.createElement("div");
    postDiv.className = "post";

    postDiv.innerHTML = `
    <div class="post-footer">
    <h4>${post.content}</h4>
        <span>${post.username}</span>
        <span>${
          post.timestamp?.seconds
            ? new Date(post.timestamp.seconds * 1000).toLocaleString()
            : ""
        }</span>
        ${
          auth.currentUser && auth.currentUser.uid === post.userId
            ? `
            <div class="postBtnContainer">
              <button class= "postBtn editBtn" onclick="editPost('${docSnap.id}')">Edit</button>
              <button class= "postBtn deleteBtn" onclick="deletePost('${docSnap.id}')">Delete</button>
            </div>
            `
            : ""
        }
      </div>
    `;

    postsList.appendChild(postDiv);
  });
}

// Delete Post
window.deletePost = async function (postId) {
  try {
    await deleteDoc(doc(db, "posts", postId));
    displayPosts();
  } catch (error) {
    console.error("Delete post error:", error.message);
  }
};

// Edit Post
window.editPost = async function (postId) {
  const newContent = prompt("Edit your post:");
  if (newContent && newContent.trim() !== "") {
    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        content: newContent.trim(),
        timestamp: serverTimestamp(),
      });
      displayPosts();
    } catch (error) {
      console.error("Edit post error:", error.message);
    }
  }
};

// Listen to Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    signupForm.style.display = "none";
    signinForm.style.display = "none";
    homeContainer.style.display = "flex";
    displayPosts();
  } else {
    homeContainer.style.display = "none";
    signinForm.style.display = "flex";
  }
});
