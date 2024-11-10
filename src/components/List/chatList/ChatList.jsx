import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./chatList.css";
import { Form, Stack } from "react-bootstrap";

const ChatList = ({ setInput }) => {
  return (
    <>
      <Stack
        direction="horizontal"
        className="my-2 justify-content-between me-2"
        gap={2}
      >
        {/* <img src="/search.png" alt="" className="fixed-icons" /> */}
        <Form.Control
          type="text"
          placeholder="Search"
          name="Search"
          onChange={(e) => setInput(e.target.value)}
        />{" "}
        <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
      </Stack>
    </>
  );
};
export default ChatList;
