import { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import "./login.css";
import { 
  getAuth, 
  sendPasswordResetEmail, 
  signInWithPopup,
  signInWithEmailAndPassword,
 } from "firebase/auth";
import { useSession } from "../../lib/useSession";
// Import Google Provider
import { googleProvider } from "../../lib/firebase";

//Login template
export const Login = () => {
  const [validated, setValidated] = useState(false);
  const auth = getAuth();
  const { addToActiveSession } = useSession();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resetEmail, setResetEmail] = useState(""); // State for forgot password email
  const [resetMessage, setResetMessage] = useState(null); // State for reset message

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    event.preventDefault();
    setValidated(true);

    if (form.checkValidity() === false) {
      event.stopPropagation();
      return;
    }
    setError(null);
    setSuccess(null);
    const formData = new FormData(event.target);
    const { email, password } = Object.fromEntries(formData.entries());

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        localStorage.removeItem("userID");
        addToActiveSession();
        setSuccess(true);
      })
      .catch((error) => {
        setError("Invalid credentials!! Try again");
      });
  };

  // Google sign-in handler
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(false);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Addng active session
      localStorage.removeItem("userID");
      addToActiveSession();
      setSuccess(true);
    } catch (error) {
      setError("Google sign-in failed! : Please try again!");
      console.error(error);
    }
  };

  // Forgot Password 
 const handleResetPassword = () => {
  setError(null);
  setResetMessage(null);
  if (!resetEmail) {
    setError("Please enter your email to reset your password.");
    return;
  }
  sendPasswordResetEmail(auth, resetEmail)
    .then(() => {
      setResetMessage("Password reset email sent! Check your inbox.");
    })
    .catch(() => {
      setError("Error sending reset email. Please try again.");
    });
 };

  return (
    <div className="login-container">
      <h2>Welcome Back</h2>
      <Form
        noValidate
        validated={validated}
        onSubmit={handleSubmit}
        className="login-form"
      >
        <Row className="mb-3">
          <Form.Group controlId="validationCustom013">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="test@email.com"
              required
            />
            <Form.Control.Feedback type="invalid">
              Please provide a valid email.
            </Form.Control.Feedback>
          </Form.Group>
        </Row>
        <Row className="mb-3">
          <Form.Group controlId="validationCustom014">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              name="password"
              placeholder="*****"
              required
            />
            <Form.Control.Feedback type="invalid">
              Please provide a valid password.
            </Form.Control.Feedback>
          </Form.Group>
        </Row>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>Login successful!</p>}

        <Button variant = "dark" type="submit" className="me-2">Sign In</Button>

        {/* Google Sign-In  */}
        <Button variant = "primary" onClick={ handleGoogleSignIn }>
          Sign In with Google
        </Button>

        <Row className="mb-3 mt-3">
          <Form.Group controlId="resetEmail">
            <Form.Label>Forgot Password? Enter Email to Reset</Form.Label>
            <Form.Control
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Enter your email"
              style={{ marginBottom: '10px' }}
            />
          </Form.Group>
          <Button variant="dark" className = "mt-2" size = "sm" onClick={handleResetPassword}>
            Forgot Password
          </Button>
        </Row>

        {resetMessage && <p style={{ color: "green" }}>{resetMessage}</p>}
      </Form>
    </div>
  );
};
