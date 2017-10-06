import React, { Component } from "react";
import io from "socket.io-client";
import { Route, NavLink } from "react-router-dom";
import "./App.css";

class App extends Component {
  state = {
    users: [],
    loggedInUser: "",
    logoutTime: "",
    rooms: [],
    messageTo: "",
    messages: []
  };

  updateChatTo = (messageTo, user) => {
    this.setState({ messageTo });
    this.getMessages(messageTo, user);
  };

  clearChatTo = messageTo => {
    this.setState({ messageTo: "", messages: [] });
  };

  componentDidMount() {
    var socket = io.connect("http://localhost:3000");

    socket.on("socket-post-rooms", data => {
      let newRooms = this.state.rooms.concat(data.message);
      this.setState({ rooms: newRooms });
    });

    socket.on("socket-post-message-room", data => {
      if (data.room && data.room === this.state.messageTo) {
        let newMessage = this.state.messages.concat(data);
        this.setState({ messages: newMessage });
      } else if (
        (!data.room &&
          (data.to === this.state.loggedInUser &&
            data.from === this.state.messageTo)) ||
        (data.from === this.state.loggedInUser &&
          data.to === this.state.messageTo)
      ) {
        let newMessage = this.state.messages.concat(data);
        this.setState({ messages: newMessage });
      }
    });
  }

  createRoom = roomName => {
    fetch("http://localhost:3000/rooms", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        roomName: roomName
      })
    }).catch(err => console.log(err));
  };

  loginUser = userName => {
    fetch("http://localhost:3000/users?username=" + userName)
      .then(response => {
        return response.json().then(responseJSON => {
          if (responseJSON.length) {
            this.setState({
              loggedInUser: responseJSON[0].userName,
              logoutTime: responseJSON[0].logoutTime
            });
          }
        });
      })
      .catch(err => console.log(err));
  };

  logoutUser = userName => {
    fetch("http://localhost:3000/logout", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userName: this.state.loggedInUser
      })
    })
      .then(response => {
        return response.json().then(responseJSON => {
          this.setState({
            loggedInUser: "",
            users: [],
            rooms: [],
            messages: [],
            logoutTime: "",
            messageTo: ""
          });
        });
      })
      .catch(err => console.log(err));
  };

  getRooms = () => {
    fetch("http://localhost:3000/rooms")
      .then(response => {
        return response.json().then(responseJSON => {
          this.setState({ rooms: responseJSON });
        });
      })
      .catch(err => console.log(err));
  };

  getUsers = () => {
    fetch("http://localhost:3000/users")
      .then(response => {
        return response.json().then(responseJSON => {
          this.setState({ users: responseJSON });
        });
      })
      .catch(err => console.log(err));
  };

  postMessages = (message, room) => {
    fetch("http://localhost:3000/messages", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: this.state.loggedInUser,
        to: this.state.messageTo,
        message,
        room
      })
    })
      .then(responseJSON => {
        let d = new Date();
        let n = d.getTime();
        this.setState({ logoutTime: n });
      })
      .catch(err => console.log(err));
  };

  getMessages(messagesTo, user) {
    let url = "http://localhost:3000/messages?to=" + messagesTo;
    url = user ? url + "&from=" + this.state.loggedInUser : url;

    fetch(url)
      .then(response => {
        return response.json().then(responseJSON => {
          this.setState({ messages: responseJSON });
        });
      })
      .catch(err => console.log(err));
  }

  render() {
    if (this.state.loggedInUser) {
      return (
        <div>
          <nav className="main-navigation">
            <NavLink activeClassName="active" to="/users">
              USERS
            </NavLink>
            <NavLink activeClassName="active" to="/rooms">
              ROOMS
            </NavLink>
            <a className="logout" onClick={this.logoutUser}>
              LOGOUT
            </a>
          </nav>
          <div className="main-content">
            <Route
              path="/users"
              users={this.state.users}
              render={props => (
                <Users
                  {...props}
                  users={this.state.users}
                  loggedInUser={this.state.loggedInUser}
                  logoutTime={this.state.logoutTime}
                  messageTo={this.state.messageTo}
                  messages={this.state.messages}
                  updateChatTo={this.updateChatTo}
                  postMessages={this.postMessages}
                  clearChatTo={this.clearChatTo}
                  getUsers={this.getUsers}
                />
              )}
            />
            <Route
              path="/rooms"
              users={this.state.rooms}
              render={props => (
                <Rooms
                  {...props}
                  rooms={this.state.rooms}
                  loggedInUser={this.state.loggedInUser}
                  logoutTime={this.state.logoutTime}
                  messageTo={this.state.messageTo}
                  messages={this.state.messages}
                  postMessages={this.postMessages}
                  updateChatTo={this.updateChatTo}
                  clearChatTo={this.clearChatTo}
                  getRooms={this.getRooms}
                  createRoom={this.createRoom}
                />
              )}
            />
          </div>
        </div>
      );
    } else {
      return <Login loginUser={this.loginUser} />;
    }
  }
}

var Logout = props => (
  <button className="logout" onClick={this.props.logoutUser}>
    LOGOUT
  </button>
);

class Users extends Component {
  componentDidMount() {
    this.props.getUsers();
  }

  render() {
    let users = this.props.users.map(user => {
      if (user.userName === this.props.loggedInUser) {
        return null;
      } else {
        return (
          <div key={user._id}>
            <li>
              <NavLink to={`${this.props.match.url}/` + user.userName}>
                {user.userName}
              </NavLink>
            </li>
          </div>
        );
      }
    });

    let userMessages = this.props.users.map(user => {
      return (
        <Route
          key={user._id}
          exact
          path={`${this.props.match.url}/` + user.userName}
          render={props => (
            <Messages
              {...props}
              user={user.userName}
              messages={this.props.messages}
              messageTo={this.props.messageTo}
              logoutTime={this.props.logoutTime}
              postMessages={this.props.postMessages}
              updateChatTo={this.props.updateChatTo}
              clearChatTo={this.props.clearChatTo}
            />
          )}
        />
      );
    });

    return (
      <div className="rooms-messages">
        {users}
        {userMessages}
      </div>
    );
  }
}

class Rooms extends Component {
  componentDidMount() {
    this.props.getRooms();
  }

  createRoom = e => {
    e.preventDefault();
    if (this.room.value) {
      this.props.createRoom(this.room.value);
      this.room.value = "";
    }
  };
  render() {
    let rooms = this.props.rooms.map(room => {
      return (
        <li key={room._id}>
          <NavLink to={`${this.props.match.url}/` + room.roomName}>
            {room.roomName}
          </NavLink>
        </li>
      );
    });

    let roomMessages = this.props.rooms.map(room => {
      if (room.roomName === this.props.loggedInUser) {
        return null;
      } else {
        return (
          <Route
            key={room._id}
            path={`${this.props.match.url}/` + room.roomName}
            render={props => (
              <Messages
                {...props}
                room={room.roomName}
                messages={this.props.messages}
                messageTo={this.props.messageTo}
                logoutTime={this.props.logoutTime}
                postMessages={this.props.postMessages}
                updateChatTo={this.props.updateChatTo}
                clearChatTo={this.props.clearChatTo}
              />
            )}
          />
        );
      }
    });

    return (
      <div className="rooms-messages">
        <form className="rooms" onSubmit={this.createRoom}>
          {rooms}
          <input
            type="text"
            placeholder="enter to add room"
            ref={room => (this.room = room)}
          />
        </form>
        {roomMessages}
      </div>
    );
  }
}

class Messages extends Component {
  componentDidMount() {
    if (this.props.user) {
      this.props.updateChatTo(this.props.user, true);
    } else {
      this.props.updateChatTo(this.props.room);
    }
  }

  componentWillUnmount() {
    this.props.clearChatTo();
  }

  postMessages = event => {
    event.preventDefault();
    this.props.postMessages(this.message.value, this.props.room);
    this.message.value = "";
  };

  render() {
    let messages = this.props.messages.map(message => {
      if (message.messageTime > this.props.logoutTime) {
        return (
          <div className="bold-messages" key={message._id}>
            {message.from} : {message.message}
          </div>
        );
      } else {
        return (
          <div key={message._id}>
            {message.from} : {message.message}
          </div>
        );
      }
    });

    return (
      <form onSubmit={this.postMessages}>
        <div className="messages">
          {messages}
          <input
            className="large"
            type="text"
            placeholder="enter to send message"
            ref={message => (this.message = message)}
          />
        </div>
      </form>
    );
  }
}

class Login extends Component {
  SignupUser = () => {
    fetch("http://localhost:3000/users", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userName: this.text.value
      })
    })
      .then(response => {
        return response.json().then(responseJSON => {
          this.setState({
            loggedInUser: responseJSON.userName,
            logoutTime: responseJSON.logoutTime
          });
        });
      })
      .catch(err => console.log(err));
  };

  loginUser = event => {
    event.preventDefault();
    if (this.text.value) {
      this.props.loginUser(this.text.value);
    }
  };
  render() {
    return (
      <form>
        <input type="text" ref={input => (this.text = input)} />
        <button onClick={this.loginUser}>login</button>
        <button onClick={this.SignupUser}>signup</button>
      </form>
    );
  }
}

export default App;
