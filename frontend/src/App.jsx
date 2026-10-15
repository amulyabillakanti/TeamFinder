import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const KEYS = {
  users: "tf_users_v1",
  session: "tf_session_v1",
  projects: "tf_projects_v1",
  requests: "tf_requests_v1",
  events: "tf_events_v1",
  messages: "tf_messages_v1",
  notifications: "tf_notifications_v1",
};

const read = (key, fallback = []) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const initialEvents = [
  {
    id: "event-1",
    title: "College Hackathon",
    category: "Hackathon",
    date: "2026-11-10",
    location: "College Campus",
    description: "Build a useful solution with a student team.",
  },
  {
    id: "event-2",
    title: "Project Showcase",
    category: "Showcase",
    date: "2026-11-20",
    location: "Innovation Lab",
    description: "Present your project and meet collaborators.",
  },
];

const seedProjects = [
  {
    id: "demo-1",
    title: "E-Commerce Website",
    description: "Build a modern online shopping experience.",
    skills: ["React", "Node.js", "MongoDB"],
    teamSize: 4,
    owner: "demo@teamfinder.local",
    ownerName: "Demo Student",
    members: ["demo@teamfinder.local"],
    status: "Open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "AI Study Assistant",
    description: "Create a study planner with AI-powered features.",
    skills: ["Python", "AI", "React"],
    teamSize: 3,
    owner: "demo@teamfinder.local",
    ownerName: "Demo Student",
    members: ["demo@teamfinder.local"],
    status: "Open",
    createdAt: new Date().toISOString(),
  },
];

function initializeStorage() {
  if (!localStorage.getItem(KEYS.projects))
    write(KEYS.projects, seedProjects);
  if (!localStorage.getItem(KEYS.requests))
    write(KEYS.requests, []);
  if (!localStorage.getItem(KEYS.events))
    write(KEYS.events, initialEvents);
  if (!localStorage.getItem(KEYS.messages))
    write(KEYS.messages, []);
  if (!localStorage.getItem(KEYS.notifications))
    write(KEYS.notifications, []);
}

const initials = (name = "Student") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button
      className={`tf-button ${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="tf-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Empty({ title, text }) {
  return (
    <div className="tf-empty">
      <div className="tf-empty-icon">✳</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export default function App() {
  const [users, setUsers] = useState(() => read(KEYS.users, []));
  const [session, setSession] = useState(() => read(KEYS.session, null));
  const [projects, setProjects] = useState(() => read(KEYS.projects));
  const [requests, setRequests] = useState(() => read(KEYS.requests));
  const [events, setEvents] = useState(() => read(KEYS.events));
  const [messages, setMessages] = useState(() => read(KEYS.messages));
  const [notifications, setNotifications] = useState(() =>
    read(KEYS.notifications)
  );

  const [page, setPage] = useState("Dashboard");
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("All");
  const [editingProfile, setEditingProfile] = useState(false);
  const [projectModal, setProjectModal] = useState(false);
  const [eventModal, setEventModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeConversation, setActiveConversation] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [auth, setAuth] = useState({
    name: "",
    email: "",
    password: "",
    department: "CSE",
  });

  const [profileForm, setProfileForm] = useState({
    name: "",
    department: "CSE",
    skills: "",
    bio: "",
    available: true,
  });

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    skills: "",
    teamSize: "4",
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    category: "Hackathon",
    date: "",
    location: "",
    description: "",
  });

  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    initializeStorage();
    setUsers(read(KEYS.users, []));
    setProjects(read(KEYS.projects));
    setRequests(read(KEYS.requests));
    setEvents(read(KEYS.events));
    setMessages(read(KEYS.messages));
    setNotifications(read(KEYS.notifications));
  }, []);

  useEffect(() => {
    if (session) {
      const savedUser = read(KEYS.users, []).find(
        (user) => user.email === session.email
      );
      if (savedUser) {
        setProfileForm({
          name: savedUser.name,
          department: savedUser.department || "CSE",
          skills: (savedUser.skills || []).join(", "),
          bio: savedUser.bio || "",
          available: savedUser.available !== false,
        });
      }
    }
  }, [session?.email]);

  useEffect(() => {
    if (session) write(KEYS.session, session);
    else localStorage.removeItem(KEYS.session);
  }, [session]);

  const currentUser = useMemo(
    () => users.find((user) => user.email === session?.email) || null,
    [users, session]
  );

  const myProjects = projects.filter(
    (project) => project.owner === session?.email
  );

  const myRequests = requests.filter(
    (request) => request.sender === session?.email
  );

  const incomingRequests = requests.filter((request) => {
    const project = projects.find((item) => item.id === request.projectId);
    return (
      project?.owner === session?.email &&
      request.sender !== session?.email
    );
  });

  const myNotifications = notifications
    .filter((item) => item.recipient === session?.email)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const availableSkills = [
    "All",
    ...new Set(projects.flatMap((project) => project.skills || [])),
  ];

  const visibleProjects = projects.filter((project) => {
    const text = [
      project.title,
      project.description,
      project.ownerName,
      ...(project.skills || []),
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());
    const matchesSkill =
      skillFilter === "All" || project.skills.includes(skillFilter);

    return matchesSearch && matchesSkill;
  });

  const students = users.filter(
    (user) => user.email !== session?.email
  );

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const refreshUsers = (next) => {
    setUsers(next);
    write(KEYS.users, next);
  };

  const refreshProjects = (next) => {
    setProjects(next);
    write(KEYS.projects, next);
  };

  const refreshRequests = (next) => {
    setRequests(next);
    write(KEYS.requests, next);
  };

  const refreshNotifications = (next) => {
    setNotifications(next);
    write(KEYS.notifications, next);
  };

  const notify = (recipient, title, body, link = "Notifications") => {
    const next = [
      {
        id: makeId(),
        recipient,
        title,
        body,
        link,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...read(KEYS.notifications),
    ];
    refreshNotifications(next);
  };

  const handleAuth = (event) => {
    event.preventDefault();
    setAuthError("");

    const email = auth.email.trim().toLowerCase();
    const password = auth.password;

    if (!email || !password) {
      setAuthError("Enter your email and password.");
      return;
    }

    if (authMode === "signup") {
      if (!auth.name.trim()) {
        setAuthError("Please enter your name.");
        return;
      }

      if (password.length < 6) {
        setAuthError("Use a password with at least 6 characters.");
        return;
      }

      if (users.some((user) => user.email === email)) {
        setAuthError("An account with this email already exists.");
        return;
      }

      const user = {
        id: makeId(),
        name: auth.name.trim(),
        email,
        password,
        department: auth.department || "CSE",
        skills: [],
        bio: "",
        available: true,
        createdAt: new Date().toISOString(),
      };

      const nextUsers = [...users, user];
      refreshUsers(nextUsers);
      setSession({ email });
      setPage("Dashboard");
      showToast("Welcome to TeamFinder!");
      return;
    }

    const user = users.find(
      (item) => item.email === email && item.password === password
    );

    if (!user) {
      setAuthError("Incorrect email or password.");
      return;
    }

    setSession({ email });
    setPage("Dashboard");
    showToast("Welcome back!");
  };

  const logout = () => {
    setSession(null);
    setPage("Dashboard");
    setMobileMenu(false);
    setSelectedProject(null);
    showToast("You have been logged out.");
  };

  const saveProfile = (event) => {
    event.preventDefault();
    if (!currentUser) return;

    const updated = {
      ...currentUser,
      name: profileForm.name.trim(),
      department: profileForm.department,
      skills: profileForm.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      bio: profileForm.bio.trim(),
      available: profileForm.available,
    };

    if (!updated.name) {
      showToast("Name cannot be empty.");
      return;
    }

    const nextUsers = users.map((user) =>
      user.email === session.email ? updated : user
    );

    refreshUsers(nextUsers);

    const nextProjects = projects.map((project) =>
      project.owner === session.email
        ? { ...project, ownerName: updated.name }
        : project
    );

    refreshProjects(nextProjects);
    setEditingProfile(false);
    showToast("Your profile has been updated.");
  };

  const createProject = (event) => {
    event.preventDefault();

    if (!projectForm.title.trim()) {
      showToast("Enter a project title.");
      return;
    }

    const skills = projectForm.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const project = {
      id: makeId(),
      title: projectForm.title.trim(),
      description: projectForm.description.trim(),
      skills,
      teamSize: Math.max(1, Number(projectForm.teamSize) || 4),
      owner: session.email,
      ownerName: currentUser.name,
      members: [session.email],
      status: "Open",
      createdAt: new Date().toISOString(),
    };

    refreshProjects([project, ...projects]);
    setProjectForm({
      title: "",
      description: "",
      skills: "",
      teamSize: "4",
    });
    setProjectModal(false);
    setPage("Projects");
    showToast("Project created successfully.");
  };

  const sendRequest = (project) => {
    if (project.owner === session.email) {
      showToast("You already own this project.");
      return;
    }

    const alreadySent = requests.some(
      (request) =>
        request.projectId === project.id &&
        request.sender === session.email
    );

    if (alreadySent) {
      showToast("You have already requested to join this project.");
      return;
    }

    const request = {
      id: makeId(),
      projectId: project.id,
      projectTitle: project.title,
      sender: session.email,
      senderName: currentUser.name,
      senderSkills: currentUser.skills || [],
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    refreshRequests([request, ...requests]);

    notify(
      project.owner,
      "New join request",
      `${currentUser.name} wants to join ${project.title}.`,
      "Incoming Requests"
    );

    showToast("Join request sent.");
  };

  const updateRequest = (requestId, status) => {
    const request = requests.find((item) => item.id === requestId);
    if (!request) return;

    const project = projects.find(
      (item) => item.id === request.projectId
    );

    if (!project || project.owner !== session.email) {
      showToast("You cannot update this request.");
      return;
    }

    if (request.status !== "pending") {
      showToast("This request has already been processed.");
      return;
    }

    if (
      status === "accepted" &&
      project.members.length >= project.teamSize
    ) {
      showToast("This project has reached its team size limit.");
      return;
    }

    const nextRequests = requests.map((item) =>
      item.id === requestId ? { ...item, status } : item
    );

    refreshRequests(nextRequests);

    if (status === "accepted") {
      const nextProjects = projects.map((item) =>
        item.id === project.id
          ? {
              ...item,
              members: item.members.includes(request.sender)
                ? item.members
                : [...item.members, request.sender],
              status:
                item.members.length + 1 >= item.teamSize
                  ? "Full"
                  : "Open",
            }
          : item
      );

      refreshProjects(nextProjects);
    }

    notify(
      request.sender,
      `Request ${status}`,
      `Your request for ${project.title} was ${status}.`,
      "My Requests"
    );

    showToast(`Request ${status}.`);
  };

  const deleteProject = (projectId) => {
    const project = projects.find((item) => item.id === projectId);

    if (!project || project.owner !== session.email) {
      showToast("You can only delete your own projects.");
      return;
    }

    if (!window.confirm("Delete this project and its join requests?"))
      return;

    refreshProjects(projects.filter((item) => item.id !== projectId));
    refreshRequests(
      requests.filter((request) => request.projectId !== projectId)
    );

    showToast("Project deleted.");
  };

  const markAllRead = () => {
    refreshNotifications(
      notifications.map((item) =>
        item.recipient === session.email
          ? { ...item, read: true }
          : item
      )
    );
    showToast("Notifications marked as read.");
  };

  const openPage = (nextPage) => {
    setPage(nextPage);
    setMobileMenu(false);
    setSearch("");
    setSkillFilter("All");
    setSelectedProject(null);
  };

  const sendMessage = (event) => {
    event.preventDefault();

    if (!activeConversation || !messageText.trim()) return;

    const otherUser = users.find(
      (user) => user.email === activeConversation
    );

    if (!otherUser) return;

    const message = {
      id: makeId(),
      from: session.email,
      to: activeConversation,
      senderName: currentUser.name,
      text: messageText.trim(),
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [message, ...messages];
    setMessages(nextMessages);
    write(KEYS.messages, nextMessages);
    setMessageText("");

    notify(
      activeConversation,
      "New message",
      `${currentUser.name} sent you a message.`,
      "Messages"
    );
  };

  const createEvent = (event) => {
    event.preventDefault();

    if (!eventForm.title.trim() || !eventForm.date) {
      showToast("Enter an event name and date.");
      return;
    }

    const nextEvents = [
      {
        ...eventForm,
        id: makeId(),
        createdBy: session.email,
      },
      ...events,
    ];

    setEvents(nextEvents);
    write(KEYS.events, nextEvents);
    setEventModal(false);
    setEventForm({
      title: "",
      category: "Hackathon",
      date: "",
      location: "",
      description: "",
    });
    showToast("Event added.");
  };

  if (!session || !currentUser) {
    return (
      <div className="tf-auth-page">
        <div className="tf-auth-decoration decoration-one" />
        <div className="tf-auth-decoration decoration-two" />

        <header className="tf-auth-header">
          <div className="tf-brand-mark">T</div>
          <span>TeamFinder</span>
        </header>

        <main className="tf-auth-layout">
          <section className="tf-auth-intro">
            <span className="tf-eyebrow">YOUR NEXT TEAM STARTS HERE</span>
            <h1>
              Great projects begin with
              <em> the right people.</em>
            </h1>
            <p>
              Find teammates who share your skills, discover projects,
              and turn your ideas into something meaningful.
            </p>

            <div className="tf-auth-points">
              <div><span>✳</span> Find your project people</div>
              <div><span>✳</span> Showcase your skills</div>
              <div><span>✳</span> Build something together</div>
            </div>
          </section>

          <section className="tf-auth-card">
            <div className="tf-auth-card-heading">
              <span className="tf-eyebrow">
                {authMode === "login" ? "WELCOME BACK" : "YOUR JOURNEY BEGINS"}
              </span>
              <h2>
                {authMode === "login" ? "Sign in" : "Create your account"}
              </h2>
              <p>
                {authMode === "login"
                  ? "Pick up where your next big idea begins."
                  : "Join your campus community and find your team."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="tf-form">
              {authMode === "signup" && (
                <>
                  <Field label="Full name">
                    <input
                      value={auth.name}
                      onChange={(e) =>
                        setAuth({ ...auth, name: e.target.value })
                      }
                      placeholder="Your name"
                      required
                    />
                  </Field>

                  <Field label="Department">
                    <select
                      value={auth.department}
                      onChange={(e) =>
                        setAuth({ ...auth, department: e.target.value })
                      }
                    >
                      <option>CSE</option>
                      <option>IT</option>
                      <option>ECE</option>
                      <option>EEE</option>
                      <option>Mechanical</option>
                      <option>Civil</option>
                      <option>Other</option>
                    </select>
                  </Field>
                </>
              )}

              <Field label="Email address">
                <input
                  type="email"
                  value={auth.email}
                  onChange={(e) =>
                    setAuth({ ...auth, email: e.target.value })
                  }
                  placeholder="you@college.edu"
                  required
                />
              </Field>

              <Field label="Password">
                <input
                  type="password"
                  value={auth.password}
                  onChange={(e) =>
                    setAuth({ ...auth, password: e.target.value })
                  }
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                />
              </Field>

              {authError && <p className="tf-error">{authError}</p>}

              <Button type="submit" className="tf-full-button">
                {authMode === "login" ? "Sign in to TeamFinder" : "Create account"}
                <span>↗</span>
              </Button>
            </form>

            <div className="tf-auth-switch">
              {authMode === "login"
                ? "New to TeamFinder?"
                : "Already have an account?"}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setAuthError("");
                }}
              >
                {authMode === "login" ? "Create account" : "Sign in"}
              </button>
            </div>

            <p className="tf-auth-note">
              This starter stores credentials in browser storage. It is
              for local development only, not production authentication.
            </p>
          </section>
        </main>

        <footer className="tf-auth-footer">
          Made for students who want to build more, together.
        </footer>
      </div>
    );
  }

  const navigation = [
    {
      heading: "WORKSPACE",
      items: [
        ["Dashboard", "⌂"],
        ["Projects", "▧"],
        ["Find Teammates", "♧"],
        ["My Projects", "▤"],
      ],
    },
    {
      heading: "COLLABORATE",
      items: [
        ["Incoming Requests", "↙"],
        ["My Requests", "↗"],
        ["Messages", "✉"],
        ["Notifications", "♢"],
      ],
    },
    {
      heading: "DISCOVER",
      items: [
        ["Events", "◷"],
        ["My Profile", "◎"],
        ["About", "✳"],
      ],
    },
  ];

  const unreadCount = myNotifications.filter((item) => !item.read).length;

  const pageDescriptions = {
    Dashboard: "Your workspace, all in one place.",
    Projects: "Discover ideas worth building together.",
    "Find Teammates": "Meet students who bring different skills to the table.",
    "My Projects": "Manage the projects you have started.",
    "Incoming Requests": "Review students who want to join your projects.",
    "My Requests": "Keep track of the teams you have reached out to.",
    Messages: "Continue the conversations that move projects forward.",
    Notifications: "Stay up to date with your activity.",
    Events: "Discover opportunities to learn, build, and connect.",
    "My Profile": "Show the community what you bring to a team.",
    About: "A better way for students to find their people.",
  };

  const renderProjectCard = (project, own = false) => {
    const sent = requests.find(
      (request) =>
        request.projectId === project.id &&
        request.sender === session.email
    );

    return (
      <article className="tf-project-card" key={project.id}>
        <div className="tf-card-topline">
          <span className="tf-category-chip">STUDENT PROJECT</span>
          <span
            className={`tf-status ${
              project.status === "Full" ? "status-full" : ""
            }`}
          >
            {project.status}
          </span>
        </div>

        <h3>{project.title}</h3>
        <p className="tf-project-description">
          {project.description || "A new idea ready for collaboration."}
        </p>

        <div className="tf-skill-list">
          {(project.skills || []).map((skill) => (
            <span className="tf-skill" key={skill}>{skill}</span>
          ))}
          {!(project.skills || []).length && (
            <span className="tf-muted-small">Skills not specified</span>
          )}
        </div>

        <div className="tf-project-meta">
          <span>♧ {project.members?.length || 1}/{project.teamSize} members</span>
          <span>By {project.ownerName}</span>
        </div>

        <div className="tf-card-actions">
          <Button
            variant="secondary"
            onClick={() => setSelectedProject(project)}
          >
            View details
          </Button>

          {own ? (
            <Button
              variant="danger"
              onClick={() => deleteProject(project.id)}
            >
              Delete
            </Button>
          ) : project.owner === session.email ? (
            <Button variant="secondary" disabled>Your project</Button>
          ) : sent ? (
            <Button variant="secondary" disabled>
              {sent.status === "pending"
                ? "Request pending"
                : sent.status === "accepted"
                ? "Request accepted"
                : "Request declined"}
            </Button>
          ) : project.status === "Full" ? (
            <Button variant="secondary" disabled>Team full</Button>
          ) : (
            <Button onClick={() => sendRequest(project)}>Request to join ↗</Button>
          )}
        </div>
      </article>
    );
  };

  const renderDashboard = () => (
    <>
      <section className="tf-welcome-panel">
        <div>
          <span className="tf-eyebrow">YOUR STUDENT WORKSPACE</span>
          <h2>Welcome, {currentUser.name.split(" ")[0]}.</h2>
          <p>
            Every great idea needs a team. Let’s find yours.
          </p>
          <Button onClick={() => openPage("Projects")}>
            Explore projects <span>↗</span>
          </Button>
        </div>
        <div className="tf-welcome-art" aria-hidden="true">
          <div className="tf-art-circle circle-a" />
          <div className="tf-art-circle circle-b" />
          <span className="tf-art-star">✳</span>
          <span className="tf-art-label">IDEAS → PEOPLE → IMPACT</span>
        </div>
      </section>

      <section className="tf-stat-grid">
        {[
          ["My projects", myProjects.length, "Projects you created"],
          ["Requests sent", myRequests.length, "Your collaboration requests"],
          ["Incoming requests", incomingRequests.filter((r) => r.status === "pending").length, "Waiting for your response"],
          ["Unread updates", unreadCount, "Notifications to check"],
        ].map(([title, value, note]) => (
          <button
            className="tf-stat-card"
            key={title}
            onClick={() =>
              openPage(
                title === "My projects"
                  ? "My Projects"
                  : title === "Requests sent"
                  ? "My Requests"
                  : title === "Incoming requests"
                  ? "Incoming Requests"
                  : "Notifications"
              )
            }
          >
            <span>{title}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </button>
        ))}
      </section>

      <section className="tf-section">
        <div className="tf-section-heading">
          <div>
            <span className="tf-eyebrow">MADE FOR COLLABORATION</span>
            <h2>Explore projects</h2>
          </div>
          <button className="tf-text-link" onClick={() => openPage("Projects")}>
            View all projects ↗
          </button>
        </div>

        {projects.length ? (
          <div className="tf-project-grid">
            {projects.slice(0, 3).map((project) => renderProjectCard(project))}
          </div>
        ) : (
          <Empty title="Your next project starts here" text="Create a project and invite your first teammates." />
        )}
      </section>

      <section className="tf-bottom-grid">
        <div className="tf-panel">
          <div className="tf-section-heading">
            <h3>Quick actions</h3>
          </div>
          <button className="tf-action-row" onClick={() => setProjectModal(true)}>
            <span className="tf-action-icon">＋</span>
            <span><b>Create a project</b><small>Turn an idea into a team</small></span>
            <span>↗</span>
          </button>
          <button className="tf-action-row" onClick={() => openPage("Find Teammates")}>
            <span className="tf-action-icon">♧</span>
            <span><b>Find teammates</b><small>Discover students by skill</small></span>
            <span>↗</span>
          </button>
          <button className="tf-action-row" onClick={() => openPage("My Profile")}>
            <span className="tf-action-icon">◎</span>
            <span><b>Update your profile</b><small>Show what you can do</small></span>
            <span>↗</span>
          </button>
        </div>

        <div className="tf-panel">
          <div className="tf-section-heading">
            <h3>Upcoming events</h3>
            <button className="tf-text-link" onClick={() => openPage("Events")}>See all ↗</button>
          </div>
          {events.slice(0, 3).map((event) => (
            <div className="tf-event-row" key={event.id}>
              <div className="tf-event-date">
                <strong>{new Date(`${event.date}T12:00:00`).getDate()}</strong>
                <span>
                  {new Date(`${event.date}T12:00:00`).toLocaleString("en", { month: "short" })}
                </span>
              </div>
              <div><b>{event.title}</b><small>{event.category} · {event.location}</small></div>
            </div>
          ))}
          {!events.length && <p className="tf-muted-small">No events yet.</p>}
        </div>
      </section>
    </>
  );

  const renderProjects = () => (
    <section className="tf-section">
      <div className="tf-toolbar">
        <div className="tf-search">
          <span>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, skills, or creators..."
          />
        </div>
        <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}>
          {availableSkills.map((skill) => <option key={skill}>{skill}</option>)}
        </select>
        <Button onClick={() => setProjectModal(true)}>＋ Create project</Button>
      </div>

      <div className="tf-results-caption">
        <span>{visibleProjects.length} projects found</span>
        <span>Discover · Connect · Build</span>
      </div>

      {visibleProjects.length ? (
        <div className="tf-project-grid">
          {visibleProjects.map((project) => renderProjectCard(project))}
        </div>
      ) : (
        <Empty title="No projects found" text="Try a different search or create a project of your own." />
      )}
    </section>
  );

  const renderMyProjects = () => (
    <section className="tf-section">
      <div className="tf-toolbar">
        <p className="tf-muted-small">Projects created by your account.</p>
        <Button onClick={() => setProjectModal(true)}>＋ Create project</Button>
      </div>
      {myProjects.length ? (
        <div className="tf-project-grid">
          {myProjects.map((project) => renderProjectCard(project, true))}
        </div>
      ) : (
        <Empty title="You haven't created a project yet" text="Start with an idea and invite people who have the skills you need." />
      )}
    </section>
  );

  const renderIncomingRequests = () => (
    <section className="tf-section">
      {incomingRequests.length ? (
        <div className="tf-request-list">
          {incomingRequests.map((request) => {
            const project = projects.find((p) => p.id === request.projectId);
            const applicant = users.find((u) => u.email === request.sender);
            return (
              <article className="tf-request-card" key={request.id}>
                <div className="tf-request-header">
                  <div className="tf-avatar">{initials(request.senderName)}</div>
                  <div className="tf-request-person">
                    <h3>{request.senderName}</h3>
                    <p>{applicant?.department || "Student"} · {request.sender}</p>
                  </div>
                  <span className={`tf-status status-${request.status}`}>
                    {request.status}
                  </span>
                </div>

                <div className="tf-request-project">
                  <span className="tf-eyebrow">REQUESTED PROJECT</span>
                  <h4>{project?.title || request.projectTitle}</h4>
                  <p>{project?.description || "Project details unavailable."}</p>
                  <div className="tf-skill-list">
                    {(applicant?.skills || request.senderSkills || []).map((skill) => (
                      <span className="tf-skill" key={skill}>{skill}</span>
                    ))}
                  </div>
                  <p className="tf-muted-small">
                    Team: {project?.members?.length || 1}/{project?.teamSize || "—"} members
                    {project?.skills?.length
                      ? ` · Required: ${project.skills.join(", ")}`
                      : ""}
                  </p>
                </div>

                {request.status === "pending" && (
                  <div className="tf-card-actions">
                    <Button onClick={() => updateRequest(request.id, "accepted")}>
                      ✓ Accept request
                    </Button>
                    <Button variant="secondary" onClick={() => updateRequest(request.id, "declined")}>
                      Decline
                    </Button>
                    <Button variant="secondary" onClick={() => {
                      setActiveConversation(request.sender);
                      openPage("Messages");
                      setActiveConversation(request.sender);
                    }}>
                      Message applicant
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <Empty title="No incoming requests yet" text="When students request to join your projects, you'll see their details here." />
      )}
    </section>
  );

  const renderMyRequests = () => (
    <section className="tf-section">
      {myRequests.length ? (
        <div className="tf-request-list">
          {myRequests.map((request) => (
            <article className="tf-request-card tf-outgoing-card" key={request.id}>
              <div>
                <span className="tf-eyebrow">PROJECT REQUEST</span>
                <h3>{request.projectTitle}</h3>
                <p>Sent {new Date(request.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`tf-status status-${request.status}`}>{request.status}</span>
            </article>
          ))}
        </div>
      ) : (
        <Empty title="No requests sent" text="Explore projects and request to join a team that matches your skills." />
      )}
    </section>
  );

  const renderTeammates = () => {
    const matchingUsers = students.filter((user) => {
      const content = `${user.name} ${user.department} ${(user.skills || []).join(" ")} ${user.bio || ""}`.toLowerCase();
      return content.includes(search.toLowerCase());
    });

    return (
      <section className="tf-section">
        <div className="tf-toolbar">
          <div className="tf-search">
            <span>⌕</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, department, or skill..." />
          </div>
        </div>

        {matchingUsers.length ? (
          <div className="tf-people-grid">
            {matchingUsers.map((user) => (
              <article className="tf-person-card" key={user.email}>
                <div className="tf-avatar tf-avatar-large">{initials(user.name)}</div>
                <h3>{user.name}</h3>
                <p>{user.department || "Student"}</p>
                <span className={`tf-availability ${user.available === false ? "not-available" : ""}`}>
                  {user.available === false ? "Not looking right now" : "● Available for projects"}
                </span>
                <p className="tf-person-bio">{user.bio || "Ready to learn, collaborate, and build."}</p>
                <div className="tf-skill-list">
                  {(user.skills || []).map((skill) => <span className="tf-skill" key={skill}>{skill}</span>)}
                </div>
                <Button variant="secondary" onClick={() => {
                  setActiveConversation(user.email);
                  openPage("Messages");
                  setActiveConversation(user.email);
                }}>Message student ↗</Button>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="No teammates found" text="Create another account in this demo or try a different search." />
        )}
      </section>
    );
  };

  const renderProfile = () => (
    <section className="tf-profile-layout">
      <div className="tf-profile-card">
        <div className="tf-profile-cover"><span>TEAMFINDER COMMUNITY</span></div>
        <div className="tf-profile-main">
          <div className="tf-avatar tf-profile-avatar">{initials(currentUser.name)}</div>
          <div className="tf-profile-name">
            <h2>{currentUser.name}</h2>
            <p>{currentUser.department} · Student</p>
            <span className={`tf-availability ${currentUser.available === false ? "not-available" : ""}`}>
              {currentUser.available === false ? "Not available" : "● Open to collaboration"}
            </span>
          </div>
          <Button variant="secondary" onClick={() => setEditingProfile(!editingProfile)}>
            {editingProfile ? "Cancel editing" : "✎ Edit profile"}
          </Button>
        </div>

        {editingProfile ? (
          <form className="tf-profile-form" onSubmit={saveProfile}>
            <Field label="Full name">
              <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
            </Field>
            <Field label="Department">
              <select value={profileForm.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}>
                {["CSE", "IT", "ECE", "EEE", "Mechanical", "Civil", "Other"].map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Skills (comma-separated)">
              <input value={profileForm.skills} onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })} placeholder="React, Java, Python" />
            </Field>
            <Field label="About you">
              <textarea rows="4" value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} placeholder="Tell others what you're interested in..." />
            </Field>
            <label className="tf-checkbox-row">
              <input type="checkbox" checked={profileForm.available} onChange={(e) => setProfileForm({ ...profileForm, available: e.target.checked })} />
              I'm available for new projects
            </label>
            <Button type="submit">Save changes</Button>
          </form>
        ) : (
          <div className="tf-profile-details">
            <h3>About</h3>
            <p>{currentUser.bio || "Add a short bio to help teammates get to know you."}</p>
            <h3>Skills & interests</h3>
            <div className="tf-skill-list">
              {(currentUser.skills || []).length
                ? currentUser.skills.map((skill) => <span className="tf-skill" key={skill}>{skill}</span>)
                : <span className="tf-muted-small">No skills added yet.</span>}
            </div>
            <div className="tf-profile-info">
              <span>Email</span><b>{currentUser.email}</b>
              <span>Department</span><b>{currentUser.department}</b>
              <span>Projects created</span><b>{myProjects.length}</b>
            </div>
          </div>
        )}
      </div>

      <aside className="tf-profile-side">
        <div className="tf-panel">
          <span className="tf-eyebrow">YOUR WORKSPACE</span>
          <h3>Make your profile count.</h3>
          <p>Clear skills and a short bio help teammates find the right collaborator.</p>
          <div className="tf-profile-completion">
            <span>Profile checklist</span>
            {[
              ["Name", !!currentUser.name],
              ["Department", !!currentUser.department],
              ["Skills", !!currentUser.skills?.length],
              ["Bio", !!currentUser.bio],
            ].map(([label, done]) => (
              <div className="tf-check-row" key={label}>
                <span className={done ? "check-done" : ""}>{done ? "✓" : "○"}</span>{label}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </section>
  );

  const renderNotifications = () => (
    <section className="tf-section">
      <div className="tf-toolbar">
        <p className="tf-muted-small">{unreadCount} unread notifications</p>
        <Button variant="secondary" onClick={markAllRead}>Mark all as read</Button>
      </div>
      {myNotifications.length ? (
        <div className="tf-notification-list">
          {myNotifications.map((item) => (
            <button
              className={`tf-notification ${item.read ? "" : "notification-unread"}`}
              key={item.id}
              onClick={() => {
                refreshNotifications(notifications.map((n) => n.id === item.id ? { ...n, read: true } : n));
                openPage(item.link || "Notifications");
              }}
            >
              <span className="tf-notification-icon">✳</span>
              <span className="tf-notification-body">
                <b>{item.title}</b>
                <span>{item.body}</span>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </span>
              {!item.read && <span className="tf-unread-dot" />}
            </button>
          ))}
        </div>
      ) : (
        <Empty title="You're all caught up" text="New requests and updates will appear here." />
      )}
    </section>
  );

  const renderMessages = () => {
    const contacts = users.filter((user) =>
      messages.some((m) =>
        (m.from === session.email && m.to === user.email) ||
        (m.from === user.email && m.to === session.email)
      )
    );

    const activeUser = users.find((user) => user.email === activeConversation);

    const conversation = messages
      .filter((m) =>
        (m.from === session.email && m.to === activeConversation) ||
        (m.from === activeConversation && m.to === session.email)
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return (
      <section className="tf-messages-layout">
        <div className="tf-contacts">
          <h3>Conversations</h3>
          {students.map((user) => (
            <button
              className={`tf-contact ${activeConversation === user.email ? "contact-active" : ""}`}
              key={user.email}
              onClick={() => setActiveConversation(user.email)}
            >
              <span className="tf-avatar">{initials(user.name)}</span>
              <span><b>{user.name}</b><small>{user.department}</small></span>
            </button>
          ))}
          {!students.length && <p className="tf-muted-small">No other students registered in this browser demo.</p>}
          {contacts.length === 0 && students.length > 0 && <p className="tf-muted-small">Choose a student to start a conversation.</p>}
        </div>

        <div className="tf-chat-panel">
          {activeUser ? (
            <>
              <div className="tf-chat-header">
                <span className="tf-avatar">{initials(activeUser.name)}</span>
                <div><b>{activeUser.name}</b><small>{activeUser.department}</small></div>
              </div>
              <div className="tf-chat-messages">
                {conversation.map((message) => (
                  <div className={`tf-chat-bubble ${message.from === session.email ? "bubble-mine" : ""}`} key={message.id}>
                    <p>{message.text}</p>
                    <small>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                  </div>
                ))}
                {!conversation.length && <Empty title="Start a conversation" text="Say hello and talk about collaborating." />}
              </div>
              <form className="tf-chat-form" onSubmit={sendMessage}>
                <input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Write a message..." />
                <Button type="submit">Send ↗</Button>
              </form>
            </>
          ) : (
            <Empty title="Your messages" text="Choose a student on the left to open a conversation." />
          )}
        </div>
      </section>
    );
  };

  const renderEvents = () => (
    <section className="tf-section">
      <div className="tf-toolbar">
        <p className="tf-muted-small">Hackathons, showcases, and opportunities.</p>
        <Button onClick={() => setEventModal(true)}>＋ Add event</Button>
      </div>
      {events.length ? (
        <div className="tf-events-grid">
          {events.map((event) => (
            <article className="tf-event-card" key={event.id}>
              <div className="tf-event-card-top">
                <span className="tf-category-chip">{event.category}</span>
                <span className="tf-event-symbol">✳</span>
              </div>
              <h3>{event.title}</h3>
              <p>{event.description || "An opportunity to connect and create."}</p>
              <div className="tf-event-details">
                <span>◷ {new Date(`${event.date}T12:00:00`).toLocaleDateString()}</span>
                <span>⌖ {event.location || "Location to be announced"}</span>
              </div>
              {event.createdBy === session.email && (
                <Button variant="secondary" onClick={() => {
                  const next = events.filter((e) => e.id !== event.id);
                  setEvents(next);
                  write(KEYS.events, next);
                  showToast("Event removed.");
                }}>Remove event</Button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty title="No events listed" text="Add an event to share an opportunity with your community." />
      )}
    </section>
  );

  const renderAbout = () => (
    <section className="tf-about-page">
      <div className="tf-about-hero">
        <span className="tf-eyebrow">A COMMUNITY BUILT AROUND IDEAS</span>
        <h2>Better projects happen when the right people come together.</h2>
        <p>TeamFinder helps students discover collaborators, share their skills, organize projects, and take the next step from idea to implementation.</p>
      </div>
      <div className="tf-about-grid">
        {[
          ["01", "Discover", "Find projects and people by their skills and interests."],
          ["02", "Connect", "Send join requests, review applicants, and communicate."],
          ["03", "Create", "Build a team, manage projects, and learn together."],
        ].map(([number, title, text]) => (
          <article className="tf-about-card" key={number}>
            <span>{number}</span><h3>{title}</h3><p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );

  let pageContent;

  switch (page) {
    case "Dashboard":
      pageContent = renderDashboard();
      break;
    case "Projects":
      pageContent = renderProjects();
      break;
    case "My Projects":
      pageContent = renderMyProjects();
      break;
    case "Find Teammates":
      pageContent = renderTeammates();
      break;
    case "Incoming Requests":
      pageContent = renderIncomingRequests();
      break;
    case "My Requests":
      pageContent = renderMyRequests();
      break;
    case "My Profile":
      pageContent = renderProfile();
      break;
    case "Notifications":
      pageContent = renderNotifications();
      break;
    case "Messages":
      pageContent = renderMessages();
      break;
    case "Events":
      pageContent = renderEvents();
      break;
    case "About":
      pageContent = renderAbout();
      break;
    default:
      pageContent = renderDashboard();
  }

  return (
    <div className="tf-app">
      {mobileMenu && (
        <button
          className="tf-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside className={`tf-sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <button className="tf-brand" onClick={() => openPage("Dashboard")}>
          <span className="tf-brand-mark">T</span>
          <span>TeamFinder<small>STUDENT WORKSPACE</small></span>
        </button>

        <div className="tf-sidebar-profile">
          <div className="tf-avatar">{initials(currentUser.name)}</div>
          <div><b>{currentUser.name}</b><small>{currentUser.department} student</small></div>
          <span className="tf-online-dot" />
        </div>

        <nav className="tf-navigation">
          {navigation.map((group) => (
            <div className="tf-nav-group" key={group.heading}>
              <span className="tf-nav-heading">{group.heading}</span>
              {group.items.map(([label, icon]) => (
                <button
                  className={`tf-nav-item ${page === label ? "nav-active" : ""}`}
                  key={label}
                  onClick={() => openPage(label)}
                >
                  <span className="tf-nav-icon">{icon}</span>
                  <span>{label}</span>
                  {label === "Notifications" && unreadCount > 0 && (
                    <span className="tf-nav-count">{unreadCount}</span>
                  )}
                  {label === "Incoming Requests" &&
                    incomingRequests.filter((r) => r.status === "pending").length > 0 && (
                      <span className="tf-nav-count">
                        {incomingRequests.filter((r) => r.status === "pending").length}
                      </span>
                    )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="tf-sidebar-bottom">
          <div className="tf-sidebar-tip">
            <span>✳</span>
            <b>Good things grow together.</b>
            <p>Keep your profile updated so the right teammates can find you.</p>
            <button onClick={() => openPage("My Profile")}>Update profile ↗</button>
          </div>
          <button className="tf-logout" onClick={logout}>
            <span>⇥</span> Log out
          </button>
          <span className="tf-sidebar-version">TEAMFINDER · STUDENT EDITION</span>
        </div>
      </aside>

      <main className="tf-main">
        <header className="tf-topbar">
          <button className="tf-menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">☰</button>
          <div className="tf-breadcrumb">
            <span>Workspace</span><span>/</span><b>{page}</b>
          </div>
          <div className="tf-topbar-actions">
            <button className="tf-icon-button" title="Notifications" onClick={() => openPage("Notifications")}>
              ♢{unreadCount > 0 && <i />}
            </button>
            <button className="tf-top-profile" onClick={() => openPage("My Profile")}>
              <span className="tf-avatar">{initials(currentUser.name)}</span>
              <span><b>{currentUser.name}</b><small>{currentUser.department}</small></span>
              <span>⌄</span>
            </button>
          </div>
        </header>

        <div className="tf-page-content">
          <div className="tf-page-heading">
            <div>
              <span className="tf-eyebrow">TEAMFINDER / WORKSPACE</span>
              <h1>{page}</h1>
              <p>{pageDescriptions[page] || ""}</p>
            </div>
            {page !== "Dashboard" && page !== "About" && (
              <div className="tf-page-heading-actions">
                {page === "Projects" || page === "My Projects" ? (
                  <Button onClick={() => setProjectModal(true)}>＋ New project</Button>
                ) : page === "Events" ? (
                  <Button onClick={() => setEventModal(true)}>＋ Add event</Button>
                ) : null}
              </div>
            )}
          </div>

          {pageContent}

          <footer className="tf-footer">
            <span>© {new Date().getFullYear()} TeamFinder</span>
            <span>Built for ideas, skills, and collaboration.</span>
          </footer>
        </div>
      </main>

      {projectModal && (
        <div className="tf-modal-backdrop" onClick={() => setProjectModal(false)}>
          <section className="tf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tf-modal-header">
              <div><span className="tf-eyebrow">START SOMETHING NEW</span><h2>Create a project</h2></div>
              <button className="tf-modal-close" onClick={() => setProjectModal(false)}>×</button>
            </div>
            <form className="tf-form" onSubmit={createProject}>
              <Field label="Project title">
                <input value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} placeholder="e.g. Campus marketplace" required />
              </Field>
              <Field label="Description">
                <textarea rows="3" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} placeholder="What do you want to build?" />
              </Field>
              <Field label="Required skills (comma-separated)">
                <input value={projectForm.skills} onChange={(e) => setProjectForm({ ...projectForm, skills: e.target.value })} placeholder="React, Node.js, UI/UX" />
              </Field>
              <Field label="Maximum team size">
                <input type="number" min="1" max="50" value={projectForm.teamSize} onChange={(e) => setProjectForm({ ...projectForm, teamSize: e.target.value })} required />
              </Field>
              <div className="tf-modal-actions">
                <Button type="button" variant="secondary" onClick={() => setProjectModal(false)}>Cancel</Button>
                <Button type="submit">Create project ↗</Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {eventModal && (
        <div className="tf-modal-backdrop" onClick={() => setEventModal(false)}>
          <section className="tf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tf-modal-header">
              <div><span className="tf-eyebrow">COMMUNITY OPPORTUNITIES</span><h2>Add an event</h2></div>
              <button className="tf-modal-close" onClick={() => setEventModal(false)}>×</button>
            </div>
            <form className="tf-form" onSubmit={createEvent}>
              <Field label="Event name">
                <input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} required />
              </Field>
              <Field label="Category">
                <select value={eventForm.category} onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}>
                  <option>Hackathon</option><option>Workshop</option><option>Showcase</option><option>Meetup</option><option>Other</option>
                </select>
              </Field>
              <Field label="Date">
                <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required />
              </Field>
              <Field label="Location">
                <input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="College auditorium" />
              </Field>
              <Field label="Description">
                <textarea rows="3" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
              </Field>
              <div className="tf-modal-actions">
                <Button type="button" variant="secondary" onClick={() => setEventModal(false)}>Cancel</Button>
                <Button type="submit">Add event ↗</Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedProject && (
        <div className="tf-modal-backdrop" onClick={() => setSelectedProject(null)}>
          <section className="tf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tf-modal-header">
              <div><span className="tf-eyebrow">PROJECT DETAILS</span><h2>{selectedProject.title}</h2></div>
              <button className="tf-modal-close" onClick={() => setSelectedProject(null)}>×</button>
            </div>
            <p>{selectedProject.description || "No description provided."}</p>
            <div className="tf-skill-list">
              {(selectedProject.skills || []).map((skill) => <span className="tf-skill" key={skill}>{skill}</span>)}
            </div>
            <div className="tf-profile-info">
              <span>Created by</span><b>{selectedProject.ownerName}</b>
              <span>Team size</span><b>{selectedProject.members?.length || 1}/{selectedProject.teamSize}</b>
              <span>Status</span><b>{selectedProject.status}</b>
            </div>
            <h3 className="tf-modal-subheading">Team members</h3>
            {(selectedProject.members || []).map((email) => {
              const member = users.find((user) => user.email === email);
              return <div className="tf-member-row" key={email}><span className="tf-avatar">{initials(member?.name || selectedProject.ownerName)}</span><span><b>{member?.name || selectedProject.ownerName}</b><small>{member?.department || "Student"}</small></span></div>;
            })}
            <div className="tf-modal-actions">
              <Button variant="secondary" onClick={() => setSelectedProject(null)}>Close</Button>
              {selectedProject.owner !== session.email &&
                !requests.some((r) => r.projectId === selectedProject.id && r.sender === session.email) &&
                selectedProject.status !== "Full" && (
                  <Button onClick={() => { sendRequest(selectedProject); setSelectedProject(null); }}>Request to join ↗</Button>
                )}
            </div>
          </section>
        </div>
      )}

      {toast && <div className="tf-toast" role="status">{toast}</div>}
    </div>
  );
}