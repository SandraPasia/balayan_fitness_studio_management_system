import { useState, useEffect } from "react";

// 12-hour format (para sa Trainer Availability)
const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hourStr, minuteStr] = timeStr.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minuteStr} ${ampm}`;
};

// BMI calculation (1 decimal place) + Remarks / Category
const calculateBmiInfo = (heightCm, weightKg) => {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!h || !w || h <= 0 || w <= 0) return null;

  const bmi = w / Math.pow(h / 100, 2);
  let remarks = "Normal";
  if (bmi < 18.5) remarks = "Underweight";
  else if (bmi >= 25 && bmi < 30) remarks = "Overweight";
  else if (bmi >= 30) remarks = "Obese";

  return {
    value: bmi.toFixed(1),
    remarks,
  };
};

const getBmiRemarksFromValue = (bmiVal) => {
  const bmi = Number(bmiVal);
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
};

const DashboardPage = ({ trainer, onLogout }) => {
  // Active Sidebar Tab: 'overview' | 'appointments' | 'availability' | 'progress'
  const [activeTab, setActiveTab] = useState("overview");
  // Collapsible Right Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // States para sa Appointment Review & Rejection
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // States para sa Trainer Availability & Trainers Dropdown
  const [trainersList, setTrainersList] = useState([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [availability, setAvailability] = useState([]);
  const [availDate, setAvailDate] = useState("");
  const [availStart, setAvailStart] = useState("08:00");
  const [availEnd, setAvailEnd] = useState("09:00");
  const [availError, setAvailError] = useState("");

  // States para sa Fitness Progress
  const [myClients, setMyClients] = useState([]);
  const [progressRecords, setProgressRecords] = useState([]);
  const [progClientId, setProgClientId] = useState("");
  const [progHeight, setProgHeight] = useState("");
  const [progWeight, setProgWeight] = useState("");
  const [progError, setProgError] = useState("");

  const now = new Date();
  const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const trainerName = trainer?.full_name || trainer?.username || "Trainer";
  const userId = trainer?.user_id;

  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:3000/trainer/notifications/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      });

    fetch(`http://localhost:3000/trainer/appointments/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAppointments(data);
      });

    fetch(`http://localhost:3000/trainer/availability/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAvailability(data);
      });

    fetch(`http://localhost:3000/trainer/all-trainers`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTrainersList(data);
          const current = data.find((t) => t.user_id === userId && Number(t.active_clients) < 35);
          const firstAvailable = data.find((t) => Number(t.active_clients) < 35);
          setSelectedTrainerId(
            current ? current.trainer_id : firstAvailable ? firstAvailable.trainer_id : data[0].trainer_id
          );
        }
      });

    fetch(`http://localhost:3000/trainer/my-clients/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMyClients(data);
          if (data.length > 0) setProgClientId(data[0].client_id);
        }
      });

    fetch(`http://localhost:3000/trainer/fitness-progress/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProgressRecords(data);
      });
  }, [userId]);

  // Lahat ng unique clients na may 'Accepted' appointment
  const dropdownClients = (() => {
    const map = new Map();
    myClients.forEach((c) => {
      if (c.client_id) map.set(Number(c.client_id), c.full_name);
    });
    appointments.forEach((app) => {
      if (app.appointment_status === "Accepted" && app.client_id) {
        map.set(Number(app.client_id), app.full_name);
      }
    });
    return Array.from(map.entries()).map(([client_id, full_name]) => ({
      client_id,
      full_name,
    }));
  })();

  useEffect(() => {
    if (dropdownClients.length > 0) {
      const exists = dropdownClients.some(
        (c) => Number(c.client_id) === Number(progClientId)
      );
      if (!exists) {
        setProgClientId(dropdownClients[0].client_id);
      }
    } else {
      setProgClientId("");
    }
  }, [dropdownClients, progClientId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Summary Counts (Date-based appointments, walang time filter)
  const pendingCount = appointments.filter(
    (app) => app.appointment_status === "Pending"
  ).length;
  const acceptedCount = appointments.filter(
    (app) => app.appointment_status === "Accepted"
  ).length;
  const availableSlotsCount = availability.filter(
    (slot) => slot.slot_status === "Available"
  ).length;
  const activeClientsCount = dropdownClients.length;
  const totalProgressCount = progressRecords.length;

  // Unique client counts per Membership Type (Weekly, Monthly, Yearly)
  const uniqueClientMemberships = new Map();
  appointments.forEach((app) => {
    if (app.client_id && app.membership_type && !uniqueClientMemberships.has(app.client_id)) {
      uniqueClientMemberships.set(
        app.client_id,
        String(app.membership_type).trim().toLowerCase()
      );
    }
  });

  const weeklyCount = Array.from(uniqueClientMemberships.values()).filter(
    (type) => type.includes("week")
  ).length;
  const monthlyCount = Array.from(uniqueClientMemberships.values()).filter(
    (type) => type.includes("month")
  ).length;
  const yearlyCount = Array.from(uniqueClientMemberships.values()).filter(
    (type) => type.includes("year") || type.includes("annual")
  ).length;

  const filteredNotifications = notifications.filter((n) => {
    const keyword = searchQuery.toLowerCase();
    return (
      n.text.toLowerCase().includes(keyword) ||
      n.type.toLowerCase().includes(keyword)
    );
  });

  const filteredAppointments = appointments.filter((app) => {
    const keyword = searchQuery.toLowerCase();
    return (
      app.full_name.toLowerCase().includes(keyword) ||
      (app.appointment_date || "").toLowerCase().includes(keyword) ||
      app.appointment_status.toLowerCase().includes(keyword) ||
      (app.membership_type || "").toLowerCase().includes(keyword)
    );
  });

  const filteredAvailability = availability.filter((slot) => {
    const keyword = searchQuery.toLowerCase();
    return (
      (slot.full_name || "").toLowerCase().includes(keyword) ||
      slot.available_date.toLowerCase().includes(keyword) ||
      slot.slot_status.toLowerCase().includes(keyword)
    );
  });

  const filteredProgress = progressRecords.filter((rec) => {
    const keyword = searchQuery.toLowerCase();
    return (
      (rec.client_name || "").toLowerCase().includes(keyword) ||
      (rec.recorded_date || "").toLowerCase().includes(keyword) ||
      (rec.remarks || "").toLowerCase().includes(keyword)
    );
  });

  const liveBmi = calculateBmiInfo(progHeight, progWeight);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const markAllAsRead = async () => {
    await fetch(`http://localhost:3000/trainer/notifications/${userId}/read`, {
      method: "PUT",
    });
    setNotifications(notifications.map((n) => ({ ...n, read: 1 })));
  };

  const openReviewModal = (app) => {
    setSelectedApp(app);
    setRejectionReason(app.rejection_reason || "");
  };

  const closeReviewModal = () => {
    setSelectedApp(null);
    setRejectionReason("");
  };

  const handleAppointmentAction = async (id, newStatus) => {
    const reasonToSave =
      newStatus === "Rejected" ? rejectionReason.trim() : null;

    if (newStatus === "Rejected" && !reasonToSave) {
      alert("Please type the reason for rejecting this appointment.");
      return;
    }

    const res = await fetch(`http://localhost:3000/trainer/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        rejection_reason: reasonToSave,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to update appointment.");
      return;
    }

    setAppointments(
      appointments.map((app) =>
        app.appointment_id === id
          ? {
              ...app,
              appointment_status: newStatus,
              rejection_reason: reasonToSave,
            }
          : app
      )
    );

    fetch(`http://localhost:3000/trainer/all-trainers`)
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list)) setTrainersList(list);
      });

    fetch(`http://localhost:3000/trainer/my-clients/${userId}`)
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list)) {
          setMyClients(list);
          if (!progClientId && list.length > 0) setProgClientId(list[0].client_id);
        }
      });

    closeReviewModal();
  };

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    setAvailError("");

    const res = await fetch(`http://localhost:3000/trainer/availability/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trainer_id: selectedTrainerId,
        available_date: availDate,
        start_time: availStart,
        end_time: availEnd,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setAvailError(data.error || "Failed to add schedule.");
      return;
    }

    setAvailability([...availability, data]);
    setAvailDate("");
  };

  const handleDeleteAvailability = async (availabilityId) => {
    const res = await fetch(`http://localhost:3000/trainer/availability/${availabilityId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setAvailability(availability.filter((s) => s.availability_id !== availabilityId));
    }
  };

  const handleAddProgress = async (e) => {
    e.preventDefault();
    setProgError("");

    const res = await fetch(`http://localhost:3000/trainer/fitness-progress/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: progClientId,
        height_cm: progHeight,
        weight_kg: progWeight,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setProgError(data.error || "Failed to record fitness progress.");
      return;
    }

    setProgressRecords([data, ...progressRecords]);
    setProgHeight("");
    setProgWeight("");
  };

  const handleDeleteProgress = async (progressId) => {
    const res = await fetch(`http://localhost:3000/trainer/fitness-progress/${progressId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setProgressRecords(progressRecords.filter((r) => r.progress_id !== progressId));
    }
  };

  // Reusable Appointment Requests Table (Date muna bago Membership Type)
  const renderAppointmentsTable = (rows, isExpanded = false) => (
    <div className={`table-scroll ${isExpanded ? "table-scroll-expanded" : ""}`}>
      <table className="simple-table">
        <thead>
          <tr>
            <th>Client Name</th>
            <th>Date</th>
            <th>Membership Type</th>
            <th>Membership Period</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="6" className="table-empty">
                No appointment requests found.
              </td>
            </tr>
          ) : (
            rows.map((app) => {
              const startDate = app.membership_start
                ? app.membership_start.split("T")[0]
                : null;
              const endDate = app.membership_end
                ? app.membership_end.split("T")[0]
                : null;

              return (
                <tr key={app.appointment_id}>
                  <td>{app.full_name}</td>
                  <td>{app.appointment_date ? app.appointment_date.split("T")[0] : ""}</td>
                  <td>
                    <strong>{app.membership_type || "No Membership"}</strong>
                  </td>
                  <td>
                    {startDate && endDate ? `${startDate} to ${endDate}` : "N/A"}
                  </td>
                  <td>
                    <strong className={`status-${app.appointment_status.toLowerCase()}`}>
                      {app.appointment_status}
                    </strong>
                    {app.rejection_reason && (
                      <p className="rejection-text">
                        Reason: {app.rejection_reason}
                      </p>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-review"
                      onClick={() => openReviewModal(app)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  // Reusable Trainer Availability Section (Form + Table)
  const renderAvailabilitySection = (rows, isExpanded = false) => (
    <>
      <form className="avail-form" onSubmit={handleAddAvailability}>
        <select
          value={selectedTrainerId}
          onChange={(e) => setSelectedTrainerId(Number(e.target.value))}
          required
        >
          {trainersList.map((t) => {
            const count = Number(t.active_clients || 0);
            const isFull = count >= 35;
            return (
              <option key={t.trainer_id} value={t.trainer_id} disabled={isFull}>
                {t.full_name} ({count}/35 Clients{isFull ? " - FULL" : ""})
              </option>
            );
          })}
        </select>

        <input
          type="date"
          min={todayDate}
          value={availDate}
          onChange={(e) => setAvailDate(e.target.value)}
          required
        />
        <input
          type="time"
          min="06:00"
          max="22:00"
          value={availStart}
          onChange={(e) => setAvailStart(e.target.value)}
          required
        />
        <span>to</span>
        <input
          type="time"
          min="06:00"
          max="22:00"
          value={availEnd}
          onChange={(e) => setAvailEnd(e.target.value)}
          required
        />
        <button type="submit" className="btn-review">Add Slot</button>
      </form>

      {availError && <p className="form-error-msg">{availError}</p>}

      <div className={`table-scroll table-spaced ${isExpanded ? "table-scroll-expanded" : ""}`}>
        <table className="simple-table">
          <thead>
            <tr>
              <th>Trainer Name</th>
              <th>Available Date</th>
              <th>Time Slot</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="5" className="table-empty">
                  No availability schedules added yet.
                </td>
              </tr>
            ) : (
              rows.map((slot) => (
                <tr key={slot.availability_id}>
                  <td>{slot.full_name}</td>
                  <td>{slot.available_date.split("T")[0]}</td>
                  <td>
                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                  </td>
                  <td>
                    <strong
                      className={
                        slot.slot_status === "Available"
                          ? "status-available"
                          : "status-booked"
                      }
                    >
                      {slot.slot_status}
                    </strong>
                  </td>
                  <td>
                    {slot.slot_status === "Available" ? (
                      <button
                        className="btn-reject"
                        onClick={() => handleDeleteAvailability(slot.availability_id)}
                      >
                        Delete
                      </button>
                    ) : (
                      <span>Booked</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  // Reusable Client Fitness Progress & BMI Calculator Section
  const renderProgressSection = (rows, isExpanded = false) => (
    <>
      <form className="progress-form" onSubmit={handleAddProgress}>
        <select
          value={progClientId}
          onChange={(e) => setProgClientId(Number(e.target.value))}
          required
        >
          {dropdownClients.length === 0 ? (
            <option value="">No accepted clients yet</option>
          ) : (
            dropdownClients.map((c) => (
              <option key={c.client_id} value={c.client_id}>
                {c.full_name}
              </option>
            ))
          )}
        </select>

        <input
          type="number"
          step="1"
          min="50"
          max="300"
          placeholder="Height (cm)"
          value={progHeight}
          onKeyDown={(e) => [".", ",", "e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
          onChange={(e) => setProgHeight(e.target.value.replace(/\D/g, ""))}
          required
        />

        <input
          type="number"
          step="1"
          min="20"
          max="500"
          placeholder="Weight (kg)"
          value={progWeight}
          onKeyDown={(e) => [".", ",", "e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
          onChange={(e) => setProgWeight(e.target.value.replace(/\D/g, ""))}
          required
        />

        <button
          type="submit"
          className="btn-review"
          disabled={dropdownClients.length === 0}
        >
          Add Record Progress
        </button>
      </form>

      <div className="bmi-preview-bar">
        <span>
          <strong>BMI Calculator:</strong>{" "}
          {liveBmi ? (
            <>
              <strong>{liveBmi.value}</strong>{" "}
              <span className={`bmi-badge bmi-${liveBmi.remarks.toLowerCase()}`}>
                {liveBmi.remarks}
              </span>
            </>
          ) : (
            "Enter height (cm) and weight (kg) to calculate BMI"
          )}
        </span>
      </div>

      {progError && <p className="form-error-msg">{progError}</p>}

      <div className={`table-scroll table-spaced ${isExpanded ? "table-scroll-expanded" : ""}`}>
        <table className="simple-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Date Recorded</th>
              <th>Height (cm)</th>
              <th>Weight (kg)</th>
              <th>BMI</th>
              <th>Remarks</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="7" className="table-empty">
                  No fitness progress records yet.
                </td>
              </tr>
            ) : (
              rows.map((rec) => {
                const hasStoredBmi = Number(rec.bmi) > 0;
                const fallback = calculateBmiInfo(rec.height_cm, rec.weight_kg);
                const bmiValue = hasStoredBmi
                  ? Number(rec.bmi).toFixed(1)
                  : fallback?.value || "-";
                const bmiRemarks =
                  rec.remarks ||
                  (hasStoredBmi
                    ? getBmiRemarksFromValue(rec.bmi)
                    : fallback?.remarks || "");

                return (
                  <tr key={rec.progress_id}>
                    <td>{rec.client_name}</td>
                    <td>{rec.recorded_date ? rec.recorded_date.split("T")[0] : ""}</td>
                    <td>{Math.round(Number(rec.height_cm))} cm</td>
                    <td>{Math.round(Number(rec.weight_kg))} kg</td>
                    <td>
                      <strong>{bmiValue}</strong>
                    </td>
                    <td>
                      {bmiRemarks ? (
                        <span
                          className={`bmi-badge bmi-${bmiRemarks.toLowerCase()}`}
                        >
                          {bmiRemarks}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <button
                        className="btn-reject"
                        onClick={() => handleDeleteProgress(rec.progress_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className="dash-layout">
      {/* OVERLAY KAPAG BUKAS ANG SIDEBAR */}
      {isSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* COLLAPSIBLE RIGHT SIDEBAR */}
      <aside className={`dash-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand-row">
          <div className="sidebar-brand">
            <h3>Balayan Fitness</h3>
            <span>Trainer Portal</span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`sidebar-link ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => handleSelectTab("overview")}
          >
            Dashboard Overview
          </button>

          <button
            type="button"
            className={`sidebar-link ${activeTab === "appointments" ? "active" : ""}`}
            onClick={() => handleSelectTab("appointments")}
          >
            <span>Appointment Requests</span>
            {pendingCount > 0 && (
              <span className="sidebar-badge">{pendingCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`sidebar-link ${activeTab === "availability" ? "active" : ""}`}
            onClick={() => handleSelectTab("availability")}
          >
            Trainer Availability
          </button>

          <button
            type="button"
            className={`sidebar-link ${activeTab === "progress" ? "active" : ""}`}
            onClick={() => handleSelectTab("progress")}
          >
            Fitness Progress
          </button>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-logout" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="dash-main-area">
        <header className="dash-header">
          <div className="dash-header-left">
            <h2>Welcome, {trainerName}</h2>
          </div>

          <input
            type="text"
            className="dash-search"
            placeholder="Search notifications, clients, membership, schedules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="dash-actions">
            <div className="notif-box">
              <button onClick={() => setShowNotif(!showNotif)}>
                Notifications ({unreadCount})
              </button>
              {showNotif && (
                <div className="notif-menu">
                  {filteredNotifications.length === 0 ? (
                    <p>No notifications found</p>
                  ) : (
                    filteredNotifications.map((n) => (
                      <p key={n.id} className={n.read ? "notif-read" : "notif-unread"}>
                        <strong>[{n.type}]</strong> {n.text}
                      </p>
                    ))
                  )}

                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead}>Mark all as read</button>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="menu-toggle-btn"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              ☰
            </button>
          </div>
        </header>

        <main className="dash-content">
          {/* TAB 1: COMPLETE DASHBOARD OVERVIEW */}
          {activeTab === "overview" && (
            <>
              <div className="dash-page-header">
                <h2>Dashboard</h2>
                <p>Overview of your clients, appointments, schedules, and memberships</p>
              </div>

              <div className="summary-grid">
                <div className="summary-card">
                  <span className="summary-label">Active Clients</span>
                  <strong className="summary-value">{activeClientsCount} / 35</strong>
                </div>

                <div className="summary-card">
                  <span className="summary-label">Pending Requests</span>
                  <strong className="summary-value">{pendingCount}</strong>
                </div>

                <div className="summary-card">
                  <span className="summary-label">Accepted Sessions</span>
                  <strong className="summary-value">{acceptedCount}</strong>
                </div>

                <div className="summary-card">
                  <span className="summary-label">Available Slots</span>
                  <strong className="summary-value">{availableSlotsCount}</strong>
                </div>

                <div className="summary-card">
                  <span className="summary-label">Progress Records</span>
                  <strong className="summary-value">{totalProgressCount}</strong>
                </div>

                <div className="summary-card">
                  <span className="summary-label">Weekly Members</span>
                  <strong className="summary-value">{weeklyCount}</strong>
                </div>

                <div className="summary-card">
                  <span className="summary-label">Monthly Members</span>
                  <strong className="summary-value">{monthlyCount}</strong>
                </div>

                <div className="summary-card">
                  <span className="summary-label">Yearly Members</span>
                  <strong className="summary-value">{yearlyCount}</strong>
                </div>
              </div>

              {/* 1. Appointment Requests Overview */}
              <div className="dash-box">
                <div className="dash-box-header-row">
                  <h3>Appointment Requests</h3>
                  <button
                    type="button"
                    className="btn-view-all"
                    onClick={() => handleSelectTab("appointments")}
                  >
                    View All ({filteredAppointments.length})
                  </button>
                </div>

                {renderAppointmentsTable(filteredAppointments, false)}
              </div>

              {/* 2. Trainer Availability Overview */}
              <div className="dash-box dash-box-spaced">
                <div className="dash-box-header-row">
                  <h3>Trainer Availability</h3>
                  <button
                    type="button"
                    className="btn-view-all"
                    onClick={() => handleSelectTab("availability")}
                  >
                    View All ({filteredAvailability.length})
                  </button>
                </div>

                {renderAvailabilitySection(filteredAvailability, false)}
              </div>

              {/* 3. Client Fitness Progress & BMI Calculator Overview */}
              <div className="dash-box dash-box-spaced">
                <div className="dash-box-header-row">
                  <h3>Client Fitness Progress</h3>
                  <button
                    type="button"
                    className="btn-view-all"
                    onClick={() => handleSelectTab("progress")}
                  >
                    View All ({filteredProgress.length})
                  </button>
                </div>

                {renderProgressSection(filteredProgress, false)}
              </div>
            </>
          )}

          {/* TAB 2: FULL APPOINTMENT REQUESTS VIEW */}
          {activeTab === "appointments" && (
            <>
              <div className="dash-page-header">
                <h2>Appointment Requests</h2>
                <p>Manage and review all client appointment requests and memberships</p>
              </div>

              <div className="dash-box dash-box-expanded">
                {renderAppointmentsTable(filteredAppointments, true)}
              </div>
            </>
          )}

          {/* TAB 3: FULL TRAINER AVAILABILITY VIEW */}
          {activeTab === "availability" && (
            <>
              <div className="dash-page-header">
                <h2>Trainer Availability</h2>
                <p>Add or manage available training schedules (6:00 AM - 10:00 PM)</p>
              </div>

              <div className="dash-box dash-box-expanded">
                {renderAvailabilitySection(filteredAvailability, true)}
              </div>
            </>
          )}

          {/* TAB 4: FULL CLIENT FITNESS PROGRESS VIEW */}
          {activeTab === "progress" && (
            <>
              <div className="dash-page-header">
                <h2>Client Fitness Progress</h2>
                <p>Record client height, weight, and automatically calculated BMI</p>
              </div>

              <div className="dash-box dash-box-expanded">
                {renderProgressSection(filteredProgress, true)}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Appointment Review & Rejection Modal */}
      {selectedApp && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Appointment Request Details</h3>
            <p>
              <strong>Client Name:</strong> {selectedApp.full_name}
            </p>
            <p>
              <strong>Email:</strong> {selectedApp.email}
            </p>
            <p>
              <strong>Contact:</strong> {selectedApp.contact_number}
            </p>
            <p>
              <strong>Appointment Date:</strong>{" "}
              {selectedApp.appointment_date ? selectedApp.appointment_date.split("T")[0] : ""}
            </p>
            <p>
              <strong>Membership Type:</strong>{" "}
              {selectedApp.membership_type || "No Membership"}
            </p>
            <p>
              <strong>Membership Period:</strong>{" "}
              {selectedApp.membership_start && selectedApp.membership_end
                ? `${selectedApp.membership_start.split("T")[0]} to ${selectedApp.membership_end.split("T")[0]}`
                : "N/A"}
            </p>
            <p>
              <strong>Current Status:</strong> {selectedApp.appointment_status}
            </p>

            <label>Rejection Reason (Required if rejecting):</label>
            <textarea
              rows="3"
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div className="modal-actions">
              <button
                className="btn-accept"
                onClick={() =>
                  handleAppointmentAction(selectedApp.appointment_id, "Accepted")
                }
              >
                Accept
              </button>
              <button
                className="btn-reject"
                onClick={() =>
                  handleAppointmentAction(selectedApp.appointment_id, "Rejected")
                }
              >
                Reject
              </button>
              <button className="btn-close" onClick={closeReviewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;