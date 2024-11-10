import UserList from "../../components/userList/userList";
import { useState } from "react";
import useFriendsStore from "../../lib/friendStore";
import ChatList from "./chatList/ChatList";
import "./list.css";
import Userinfo from "./userInfo/Userinfo";
import { Modal } from "react-bootstrap";
import * as formik from "formik";
import * as yup from "yup";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { doc, updateDoc, runTransaction } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage, googleProvider } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";

const List = () => {
  const { Formik } = formik;
  const { friends } = useFriendsStore();
  const [input, setInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const filteredFriends = friends?.filter((c) =>
    c.username.toLowerCase().includes(input.toLowerCase())
  );
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const currentUser = auth.currentUser;
  const { currentUser: currUser } = useUserStore();

  const schema = yup.object().shape({
    username: yup.string().required("Username is required"),
    avatar: yup
      .mixed()
      .nullable()
      .test("fileSize", "File too large", (value) => {
        return !value || (value && value.size <= 2000000); // Limit file size to 2MB
      })
      .test("fileType", "Unsupported file format", (value) => {
        return (
          !value || (value && ["image/jpeg", "image/png"].includes(value.type))
        ); // Accept JPG or PNG files
      }),
    language: yup.string(),
  });

  const showEditUser = () => {
    setShowModal(true);
  };

  const handleUpdate = async (values) => {
    setError(null);
    setSuccess(false);
    const { username, avatar, language } = values;

    try {
      let avatarURL = null;

      if (avatar) {
        const avatarRef = ref(storage, `avatars/${currentUser.uid}`);
        await uploadBytes(avatarRef, avatar);
        avatarURL = await getDownloadURL(avatarRef);
      }

      const updateData = {
        username,
        usernameLowercase: username.toLowerCase(),
      };
      if (avatarURL) {
        updateData.avatar = avatarURL;
      }
      if (language) {
        updateData.language = language;
      }

      await updateDoc(doc(db, "users", currentUser.uid), updateData);
      setSuccess(true);
      window.location.reload();
    } catch (error) {
      console.error("Profile update error", error);
      setError(error.message);
    }
  };

  return (
    <div className="list">
      <Userinfo showEditUser={showEditUser} />
      <ChatList setInput={setInput} />
      {filteredFriends?.length > 0 ? (
        <div className="listContainer">
          {filteredFriends.map((friend, index) => (
            <UserList key={index} user={friend} currentUser={currentUser} />
          ))}
        </div>
      ) : input ? (
        <div>Friend Not Found!</div>
      ) : (
        <div>Please Start By Adding New Friends</div>
      )}

      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Update User Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <Formik
              validationSchema={schema}
              onSubmit={handleUpdate}
              initialValues={{
                username: currUser?.username ? currUser?.username : "",
                email: "",
                password: "",
                language: currUser?.language ? currUser?.language : "",
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
                <Form
                  noValidate
                  onSubmit={handleSubmit}
                  className="signup-form"
                >
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
                    <Form.Group controlId="validationFormik08">
                      <Form.Label>Avatar</Form.Label>
                      <Form.Control
                        type="file"
                        name="avatar"
                        onChange={(event) => {
                          setFieldValue("avatar", event.currentTarget.files[0]);
                        }}
                        isInvalid={!!errors.avatar}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.avatar}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Row>
                  <Row className="mb-3">
                    <Form.Group controlId="validationFormik09">
                      <Form.Label>Preferred Language</Form.Label>
                      <Form.Select
                        name="language"
                        value={values.language}
                        onChange={handleChange}
                        isInvalid={!!errors.language}
                      >
                        <option value="" disabled>
                          Select your language
                        </option>
                        <option value="en">English</option>
                        <option value="ne">Nepali</option>
                        <option value="es">Spanish</option>
                        <option value="it">Italian</option>
                        <option value="fr">French</option>
                        <option value="ar">Arabic</option>

                        {/* Add more options as needed */}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.language}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Row>

                  {error && <p style={{ color: "red" }}>{error}</p>}
                  {success && (
                    <p style={{ color: "green" }}>Update successful!</p>
                  )}

                  <Button variant="dark" type="submit" className="me-2">
                    Update Info
                  </Button>
                </Form>
              )}
            </Formik>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default List;
