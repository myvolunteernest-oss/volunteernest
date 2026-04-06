import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "volunteernest-v1";

const seedData = {
  families: [
    { id: "fam-1", name: "Reed Family", email: "family1@example.com", credits: 1.5 },
    { id: "fam-2", name: "Ferguson Family", email: "family2@example.com", credits: 2 },
    { id: "fam-3", name: "Smith Family", email: "family3@example.com", credits: 0.5 },
  ],
  events: [
    {
      id: "event-1",
      title: "Spring Talent Night",
      organization: "Community Co-op",
      description: "Volunteer for check-in, concessions, gallery setup, and cleanup.",
      date: "2026-04-24",
      location: "LifePoint Church Gym",
      slots: [
        {
          id: "slot-1",
          title: "Check-In Table",
          needed: 2,
          signedUp: ["fam-1"],
          creditValue: 1,
          type: "work",
          time: "5:00 PM - 6:15 PM",
          notes: "Arrive early and greet families.",
        },
        {
          id: "slot-2",
          title: "Cupcake Donation",
          needed: 4,
          signedUp: ["fam-3"],
          creditValue: 0.5,
          type: "donation",
          time: "Drop off by 5:30 PM",
          notes: "One dozen per sign-up.",
        },
      ],
    },
  ],
};

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : seedData;
  } catch {
    return seedData;
  }
}

function saveState(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function cardStyle(extra = {}) {
  return {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
    ...extra,
  };
}

function inputStyle() {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 14,
    boxSizing: "border-box",
  };
}

function buttonStyle(kind = "primary") {
  const base = {
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid transparent",
  };

  if (kind === "secondary") {
    return {
      ...base,
      background: "#f8fafc",
      color: "#0f172a",
      border: "1px solid #d1d5db",
    };
  }

  if (kind === "danger") {
    return {
      ...base,
      background: "#fff1f2",
      color: "#be123c",
      border: "1px solid #fecdd3",
    };
  }

  return {
    ...base,
    background: "#0f172a",
    color: "white",
  };
}

function badgeStyle(background, color, border) {
  return {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background,
    color,
    border: `1px solid ${border}`,
  };
}

function statusBadge(slot) {
  const remaining = slot.needed - slot.signedUp.length;
  if (remaining <= 0) return badgeStyle("#dcfce7", "#166534", "#bbf7d0");
  if (remaining === 1) return badgeStyle("#fef3c7", "#92400e", "#fde68a");
  return badgeStyle("#e2e8f0", "#334155", "#cbd5e1");
}

function tabButtonStyle(active) {
  return active ? buttonStyle("primary") : buttonStyle("secondary");
}

export default function App() {
  const [db, setDb] = useState(seedData);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeEventId, setActiveEventId] = useState("event-1");
  const [search, setSearch] = useState("");
  const [newFamilyName, setNewFamilyName] = useState("");
  const [newFamilyEmail, setNewFamilyEmail] = useState("");
  const [selectedFamilyId, setSelectedFamilyId] = useState("fam-1");
  const [viewSlot, setViewSlot] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    organization: "",
    description: "",
    date: "",
    location: "",
  });
  const [newSlot, setNewSlot] = useState({
    title: "",
    needed: 1,
    creditValue: 1,
    type: "work",
    time: "",
    notes: "",
  });

  useEffect(() => {
    setDb(loadState());
  }, []);

  useEffect(() => {
    saveState(db);
  }, [db]);

  const events = db.events || [];
  const families = db.families || [];

  useEffect(() => {
    if (!events.find((e) => e.id === activeEventId) && events[0]) {
      setActiveEventId(events[0].id);
    }
  }, [events, activeEventId]);

  const activeEvent = useMemo(
    () => events.find((event) => event.id === activeEventId) || events[0],
    [events, activeEventId]
  );

  const filteredEvents = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return events;
    return events.filter((event) => {
      const haystack = `${event.title} ${event.organization} ${event.location} ${event.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [events, search]);

  const stats = useMemo(() => {
    const allSlots = events.flatMap((e) => e.slots || []);
    const totalSlots = allSlots.length;
    const totalOpen = allSlots.reduce((sum, slot) => sum + Math.max(slot.needed - slot.signedUp.length, 0), 0);
    const totalSignups = allSlots.reduce((sum, slot) => sum + slot.signedUp.length, 0);
    const totalCredits = families.reduce((sum, family) => sum + (family.credits || 0), 0);
    return { totalSlots, totalOpen, totalSignups, totalCredits };
  }, [events, families]);

  function addFamily() {
    if (!newFamilyName.trim() || !newFamilyEmail.trim()) {
      alert("Please add a family name and email.");
      return;
    }

    const family = {
      id: uid("fam"),
      name: newFamilyName.trim(),
      email: newFamilyEmail.trim(),
      credits: 0,
    };

    setDb((prev) => ({ ...prev, families: [...prev.families, family] }));
    setNewFamilyName("");
    setNewFamilyEmail("");
    setSelectedFamilyId(family.id);
  }

  function addEvent() {
    if (!newEvent.title.trim() || !newEvent.date) {
      alert("Please add at least an event title and date.");
      return;
    }

    const event = {
      id: uid("event"),
      ...newEvent,
      title: newEvent.title.trim(),
      organization: newEvent.organization.trim(),
      description: newEvent.description.trim(),
      location: newEvent.location.trim(),
      slots: [],
    };

    setDb((prev) => ({ ...prev, events: [event, ...prev.events] }));
    setActiveEventId(event.id);
    setNewEvent({ title: "", organization: "", description: "", date: "", location: "" });
  }

  function duplicateEvent(eventId) {
    const source = events.find((e) => e.id === eventId);
    if (!source) return;

    const copy = {
      ...source,
      id: uid("event"),
      title: `${source.title} (Copy)`,
      slots: source.slots.map((slot) => ({ ...slot, id: uid("slot"), signedUp: [] })),
    };

    setDb((prev) => ({ ...prev, events: [copy, ...prev.events] }));
    setActiveEventId(copy.id);
  }

  function removeEvent(eventId) {
    const confirmed = window.confirm("Delete this event?");
    if (!confirmed) return;
    setDb((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== eventId) }));
  }

  function addSlot() {
    if (!activeEvent) return;
    if (!newSlot.title.trim()) {
      alert("Please add a slot title.");
      return;
    }

    const slot = {
      id: uid("slot"),
      title: newSlot.title.trim(),
      needed: Number(newSlot.needed) || 1,
      signedUp: [],
      creditValue: Number(newSlot.creditValue) || 0,
      type: newSlot.type,
      time: newSlot.time.trim(),
      notes: newSlot.notes.trim(),
    };

    setDb((prev) => ({
      ...prev,
      events: prev.events.map((event) =>
        event.id === activeEvent.id ? { ...event, slots: [...event.slots, slot] } : event
      ),
    }));

    setNewSlot({
      title: "",
      needed: 1,
      creditValue: 1,
      type: "work",
      time: "",
      notes: "",
    });
  }

  function removeSlot(slotId) {
    if (!activeEvent) return;
    const confirmed = window.confirm("Delete this slot?");
    if (!confirmed) return;

    setDb((prev) => ({
      ...prev,
      events: prev.events.map((event) =>
        event.id === activeEvent.id
          ? { ...event, slots: event.slots.filter((slot) => slot.id !== slotId) }
          : event
      ),
    }));
  }

  function signUpForSlot(eventId, slotId, familyId) {
    const event = events.find((e) => e.id === eventId);
    const slot = event?.slots.find((s) => s.id === slotId);
    const family = families.find((f) => f.id === familyId);

    if (!slot || !family) return;
    if (slot.signedUp.includes(familyId)) return;
    if (slot.signedUp.length >= slot.needed) return;

    setDb((prev) => ({
      families: prev.families.map((f) =>
        f.id === familyId ? { ...f, credits: Number((f.credits + slot.creditValue).toFixed(2)) } : f
      ),
      events: prev.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              slots: e.slots.map((s) =>
                s.id === slotId ? { ...s, signedUp: [...s.signedUp, familyId] } : s
              ),
            }
          : e
      ),
    }));

    alert("Signup saved.");
  }

  function cancelSignup(eventId, slotId, familyId) {
    const event = events.find((e) => e.id === eventId);
    const slot = event?.slots.find((s) => s.id === slotId);
    if (!slot || !slot.signedUp.includes(familyId)) return;

    const confirmed = window.confirm("Cancel this signup?");
    if (!confirmed) return;

    setDb((prev) => ({
      families: prev.families.map((f) =>
        f.id === familyId ? { ...f, credits: Math.max(0, Number((f.credits - slot.creditValue).toFixed(2))) } : f
      ),
      events: prev.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              slots: e.slots.map((s) =>
                s.id === slotId
                  ? { ...s, signedUp: s.signedUp.filter((id) => id !== familyId) }
                  : s
              ),
            }
          : e
      ),
    }));
  }

  function familyName(id) {
    return families.find((f) => f.id === id)?.name || "Unknown";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={cardStyle({ padding: 24 })}>
            <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
              Organize. Serve. Connect.
            </div>
            <h1 style={{ margin: "0 0 10px 0", fontSize: 38 }}>VolunteerNest</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Your volunteer signup hub for co-ops, churches, and community groups. Easily organize
              events, track service credits, and keep families connected.
            </p>
            <div style={{ marginTop: 14 }}>
              <span style={badgeStyle("#e2e8f0", "#0f172a", "#cbd5e1")}>
                MVP Prototype • myvolunteernest.com
              </span>
            </div>
          </div>

          <div style={cardStyle({ padding: 24 })}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <StatBox label="Events" value={events.length} />
              <StatBox label="Sign-Ups" value={stats.totalSignups} />
              <StatBox label="Open Spots" value={stats.totalOpen} />
              <StatBox label="Credits" value={stats.totalCredits} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <button style={tabButtonStyle(activeTab === "dashboard")} onClick={() => setActiveTab("dashboard")}>Organizer Dashboard</button>
          <button style={tabButtonStyle(activeTab === "signup")} onClick={() => setActiveTab("signup")}>Public Sign-Up View</button>
          <button style={tabButtonStyle(activeTab === "families")} onClick={() => setActiveTab("families")}>Families & Credits</button>
        </div>

        {activeTab === "dashboard" && (
          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16 }}>
            <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
              <div style={cardStyle({ padding: 20 })}>
                <h3 style={{ marginTop: 0 }}>Create Event</h3>
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Event Title</label>
                    <input style={inputStyle()} value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Talent Night" />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Organization</label>
                    <input style={inputStyle()} value={newEvent.organization} onChange={(e) => setNewEvent({ ...newEvent, organization: e.target.value })} placeholder="FAITH Co-op" />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Date</label>
                    <input style={inputStyle()} type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Location</label>
                    <input style={inputStyle()} value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="LifePoint Church Gym" />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Description</label>
                    <textarea style={{ ...inputStyle(), minHeight: 90 }} value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Briefly explain the event and volunteer needs." />
                  </div>
                  <button style={buttonStyle()} onClick={addEvent}>Create Event</button>
                </div>
              </div>

              <div style={cardStyle({ padding: 20 })}>
                <h3 style={{ marginTop: 0 }}>Your Events</h3>
                <div style={{ marginBottom: 12 }}>
                  <input style={inputStyle()} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events" />
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setActiveEventId(event.id)}
                      style={{
                        borderRadius: 16,
                        padding: 12,
                        border: activeEvent?.id === event.id ? "1px solid #0f172a" : "1px solid #e5e7eb",
                        background: activeEvent?.id === event.id ? "#0f172a" : "#ffffff",
                        color: activeEvent?.id === event.id ? "#ffffff" : "#0f172a",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{event.title}</div>
                          <div style={{ fontSize: 12, opacity: 0.8 }}>{event.date} • {event.location || "No location"}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            style={buttonStyle("secondary")}
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateEvent(event.id);
                            }}
                          >
                            Copy
                          </button>
                          <button
                            style={buttonStyle("danger")}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeEvent(event.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div style={cardStyle({ padding: 20 })}>
                <h2 style={{ marginTop: 0 }}>{activeEvent?.title || "No event selected"}</h2>
                {activeEvent ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
                    <div>
                      <div style={{ ...cardStyle({ padding: 16, background: "#f8fafc", boxShadow: "none" }), marginBottom: 16 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                          <InfoPill text={activeEvent.date} />
                          <InfoPill text={activeEvent.location || "No location"} />
                          <InfoPill text={activeEvent.organization || "No organization"} />
                        </div>
                        <p style={{ marginTop: 12, color: "#475569" }}>{activeEvent.description || "No description added yet."}</p>
                      </div>

                      <div style={{ display: "grid", gap: 12 }}>
                        {activeEvent.slots.length === 0 ? (
                          <div style={{ ...cardStyle({ padding: 24, textAlign: "center", boxShadow: "none" }) }}>
                            No slots yet. Add your first volunteer or donation need.
                          </div>
                        ) : (
                          activeEvent.slots.map((slot) => {
                            const remaining = slot.needed - slot.signedUp.length;
                            return (
                              <div key={slot.id} style={cardStyle({ padding: 16, boxShadow: "none" })}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                                  <div>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                      <strong>{slot.title}</strong>
                                      <span style={statusBadge(slot)}>{remaining <= 0 ? "Full" : `${remaining} open`}</span>
                                      <span style={badgeStyle("#ffffff", "#475569", "#d1d5db")}>{slot.type}</span>
                                    </div>
                                    <div style={{ marginTop: 6, fontSize: 14, color: "#64748b" }}>
                                      {slot.time || "No time listed"} • {slot.creditValue} credit{slot.creditValue === 1 ? "" : "s"}
                                    </div>
                                    {slot.notes ? <p style={{ marginTop: 8, color: "#475569" }}>{slot.notes}</p> : null}
                                  </div>
                                  <button style={buttonStyle("danger")} onClick={() => removeSlot(slot.id)}>Delete</button>
                                </div>
                                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  {slot.signedUp.length === 0 ? (
                                    <span style={{ color: "#64748b", fontSize: 14 }}>Nobody has signed up yet.</span>
                                  ) : (
                                    slot.signedUp.map((familyId) => (
                                      <span key={familyId} style={badgeStyle("#f1f5f9", "#0f172a", "#e2e8f0")}>
                                        {familyName(familyId)}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div style={cardStyle({ padding: 20, boxShadow: "none" })}>
                      <h3 style={{ marginTop: 0 }}>Add Slot</h3>
                      <div style={{ display: "grid", gap: 12 }}>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Slot Title</label>
                          <input style={inputStyle()} value={newSlot.title} onChange={(e) => setNewSlot({ ...newSlot, title: e.target.value })} placeholder="Front Door Greeter" />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Need</label>
                            <input style={inputStyle()} type="number" min="1" value={newSlot.needed} onChange={(e) => setNewSlot({ ...newSlot, needed: e.target.value })} />
                          </div>
                          <div>
                            <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Credit Value</label>
                            <input style={inputStyle()} type="number" min="0" step="0.5" value={newSlot.creditValue} onChange={(e) => setNewSlot({ ...newSlot, creditValue: e.target.value })} />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Type</label>
                          <select style={inputStyle()} value={newSlot.type} onChange={(e) => setNewSlot({ ...newSlot, type: e.target.value })}>
                            <option value="work">Work Shift</option>
                            <option value="donation">Donation</option>
                            <option value="leadership">Leadership</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Time</label>
                          <input style={inputStyle()} value={newSlot.time} onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })} placeholder="5:30 PM - 6:30 PM" />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Notes</label>
                          <textarea style={{ ...inputStyle(), minHeight: 90 }} value={newSlot.notes} onChange={(e) => setNewSlot({ ...newSlot, notes: e.target.value })} placeholder="Instructions for this slot." />
                        </div>
                        <button style={buttonStyle()} onClick={addSlot}>Add Slot</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={cardStyle({ padding: 24, textAlign: "center", boxShadow: "none" })}>Create an event to get started.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "signup" && (
          <div style={cardStyle({ padding: 20 })}>
            <h2 style={{ marginTop: 0 }}>Public Event Sign-Up</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Select Event</label>
                <select style={inputStyle()} value={activeEvent?.id || ""} onChange={(e) => setActiveEventId(e.target.value)}>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Sign Up As</label>
                <select style={inputStyle()} value={selectedFamilyId} onChange={(e) => setSelectedFamilyId(e.target.value)}>
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>{family.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {activeEvent ? (
              <>
                <div style={{ ...cardStyle({ padding: 20, background: "#f8fafc", boxShadow: "none" }), marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <h2 style={{ margin: 0 }}>{activeEvent.title}</h2>
                      <p style={{ margin: "8px 0 0 0", color: "#64748b" }}>{activeEvent.date} • {activeEvent.location || "No location"}</p>
                    </div>
                    <span style={badgeStyle("#e2e8f0", "#0f172a", "#cbd5e1")}>{activeEvent.organization || "Organization"}</span>
                  </div>
                  <p style={{ marginTop: 12, color: "#475569" }}>{activeEvent.description}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {activeEvent.slots.map((slot) => {
                    const isSigned = slot.signedUp.includes(selectedFamilyId);
                    const isFull = slot.signedUp.length >= slot.needed;
                    return (
                      <div key={slot.id} style={cardStyle({ padding: 20 })}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{slot.title}</div>
                            <div style={{ marginTop: 6, fontSize: 14, color: "#64748b" }}>{slot.time || "No time listed"}</div>
                          </div>
                          <span style={badgeStyle("#ffffff", "#475569", "#d1d5db")}>{slot.type}</span>
                        </div>
                        <p style={{ color: "#475569", marginTop: 12 }}>{slot.notes || "No additional notes."}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginTop: 14 }}>
                          <span>{slot.signedUp.length}/{slot.needed} filled</span>
                          <span>{slot.creditValue} credit{slot.creditValue === 1 ? "" : "s"}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                          {!isSigned ? (
                            <button
                              style={isFull ? { ...buttonStyle("secondary"), width: "100%", opacity: 0.6, cursor: "not-allowed" } : { ...buttonStyle(), width: "100%" }}
                              disabled={isFull}
                              onClick={() => signUpForSlot(activeEvent.id, slot.id, selectedFamilyId)}
                            >
                              {isFull ? "Full" : "Sign Up"}
                            </button>
                          ) : (
                            <button style={{ ...buttonStyle("secondary"), width: "100%" }} onClick={() => cancelSignup(activeEvent.id, slot.id, selectedFamilyId)}>
                              Cancel
                            </button>
                          )}
                          <button style={buttonStyle("secondary")} onClick={() => setViewSlot(slot)}>
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={cardStyle({ padding: 24, textAlign: "center", boxShadow: "none" })}>No event selected.</div>
            )}
          </div>
        )}

        {activeTab === "families" && (
          <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16 }}>
            <div style={cardStyle({ padding: 20 })}>
              <h3 style={{ marginTop: 0 }}>Add Family</h3>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Family Name</label>
                  <input style={inputStyle()} value={newFamilyName} onChange={(e) => setNewFamilyName(e.target.value)} placeholder="Johnson Family" />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Email</label>
                  <input style={inputStyle()} value={newFamilyEmail} onChange={(e) => setNewFamilyEmail(e.target.value)} placeholder="family@example.com" />
                </div>
                <button style={buttonStyle()} onClick={addFamily}>Add Family</button>
              </div>
            </div>

            <div style={cardStyle({ padding: 20 })}>
              <h3 style={{ marginTop: 0 }}>Credits Dashboard</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {families.map((family) => (
                  <div key={family.id} style={cardStyle({ padding: 16, boxShadow: "none" })}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{family.name}</div>
                        <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>{family.email}</div>
                      </div>
                      <span style={badgeStyle("#e2e8f0", "#0f172a", "#cbd5e1")}>{family.credits} credits</span>
                    </div>
                    <div style={{ marginTop: 14, color: "#475569", fontSize: 14 }}>
                      {family.credits >= 2
                        ? "Volunteer requirement completed."
                        : `${Math.max(0, 2 - family.credits).toFixed(1)} more credit(s) to reach 2.`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewSlot && (
          <div
            onClick={() => setViewSlot(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ ...cardStyle({ padding: 20, maxWidth: 520, width: "100%" }) }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                <h3 style={{ marginTop: 0 }}>{viewSlot.title}</h3>
                <button style={buttonStyle("secondary")} onClick={() => setViewSlot(null)}>Close</button>
              </div>
              <div style={{ color: "#475569", lineHeight: 1.7 }}>
                <p><strong>Time:</strong> {viewSlot.time || "No time listed"}</p>
                <p><strong>Type:</strong> {viewSlot.type}</p>
                <p><strong>Credits:</strong> {viewSlot.creditValue}</p>
                <p><strong>Notes:</strong> {viewSlot.notes || "None"}</p>
                <div>
                  <strong>Current Sign-Ups:</strong>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {viewSlot.signedUp.length ? (
                      viewSlot.signedUp.map((id) => (
                        <span key={id} style={badgeStyle("#f1f5f9", "#0f172a", "#e2e8f0")}>{familyName(id)}</span>
                      ))
                    ) : (
                      <span>No one yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function InfoPill({ text }) {
  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "10px 12px", fontSize: 14 }}>
      {text}
    </div>
  );
}
