import { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import "./signup.css";
import * as formik from "formik";
import * as yup from "yup";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, db, storage, googleProvider } from "../../lib/firebase";
import { doc, setDoc, runTransaction } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const Signup = () => {
  const { Formik } = formik;
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form validation schema
  const schema = yup.object().shape({
    username: yup.string().required("Username is required"),
    email: yup.string().email("Invalid email address").required("Required"),
    password: yup
      .string()
      .required("No password provided.")
      .min(8, "Password is too short - should be 8 chars minimum.")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
        "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character"
      ),
    avatar: yup
      .mixed()
      .required("Avatar is required")
      .test("fileSize", "File too large", (value) => {
        return value && value.size <= 2000000; // Limit file size to 2MB
      })
      .test("fileType", "Unsupported file format", (value) => {
        return value && ["image/jpeg", "image/png"].includes(value.type); // Accept JPG or PNG files
      }),
  });

  // Handle form submission
  const handleSignUp = async (values) => {
    setError(null);
    setSuccess(false);
    console.log("Ok");
    try {
      const { username, email, password, avatar } = values;

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Upload avatar to Firebase Storage
      const avatarFile = avatar; // Access the selected avatar file
      const avatarRef = ref(storage, `avatars/${user.uid}`); // Create a storage reference for the avatar

      await uploadBytes(avatarRef, avatarFile); // Upload the file

      // Get the download URL of the uploaded avatar
      const avatarURL = await getDownloadURL(avatarRef);

      console.log("User signed up:", userCredential.user);
      console.log("Avatar URL:", avatarURL);
      console.log("User signed up:", userCredential.user);

      // Firestore transaction
      await runTransaction(db, async (transaction) => {
        // Create user document in "users" collection
        const userDocRef = doc(db, "users", userCredential.user.uid);
        transaction.set(userDocRef, {
          username,
          usernameLowercase: username.toLowerCase(),
          email,
          id: userCredential.user.uid,
          blocked: [],
          friends: [],
          avatar: avatarURL,
        });

        // Create user chat document in "userchats" collection
        const userChatsDocRef = doc(db, "userchats", userCredential.user.uid);
        transaction.set(userChatsDocRef, {
          chats: [],
        });
      });

      setSuccess(true);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message);
    }
  };

  // Addition of Google Sign-In
  const handleGoogleSignup = async () => {
    setError(null);
    setSuccess(false);
    try {
      // Sign in with google
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const username = user.displayName || "Anonymous";

      // Checking if the user is new or not
      await runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, "users", user.uid);
        transaction.set(userDocRef, {
          username,
          usernameLowercase: username.toLowerCase(),
          email: user.email,
          id: user.uid,
          avatar: user.photoURL,
          blocked: [],
          friends: [],
        });

        const userChatsDocRef = doc(db, "userchats", user.uid);
        transaction.set(userChatsDocRef, {
          chats: [],
        });
      });
    } catch (err) {
      console.error("Google Sign-Up error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="signup-container">
      <h2>Create an Account</h2>
      <Formik
        validationSchema={schema}
        onSubmit={handleSignUp}
        initialValues={{
          username: "",
          email: "",
          password: "",
          avatar: null,
        }}
      >
        {({
          handleSubmit,
          handleChange,
          values,
          touched,
          errors,
          setFieldValue,
        }) => (
          <Form noValidate onSubmit={handleSubmit} className="signup-form">
            <Row className="mb-3">
              <Form.Group md="3" controlId="validationFormik04">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your name here"
                  name="username"
                  value={values.username}
                  onChange={handleChange}
                  isInvalid={!!errors.username}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.username}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row className="mb-3">
              <Form.Group controlId="validationFormik05">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email here"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row className="mb-3">
              <Form.Group controlId="validationFormik07">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  isInvalid={!!errors.password}
                />

                <Form.Control.Feedback type="invalid">
                  {errors.password}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>

            <Row className="mb-3">
              <Form.Group controlId="validationFormik08">
                <Form.Label>Avatar</Form.Label>
                <Form.Control
                  type="file"
                  name="avatar"
                  onChange={(event) => {
                    setFieldValue("avatar", event.currentTarget.files[0]); // Update avatar in Formik values
                  }}
                  isInvalid={!!errors.avatar}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.avatar}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>

            {error && <p style={{ color: "red" }}>{error}</p>}
            {success && <p style={{ color: "green" }}>Signup successful!</p>}

            <Button variant="dark" type="submit" className="me-2">
              Sign Up with Email
            </Button>

            {/* Google Sign-up option */}
            <Button variant="primary" onClick={handleGoogleSignup}>
              Sign Up with Google
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
};
