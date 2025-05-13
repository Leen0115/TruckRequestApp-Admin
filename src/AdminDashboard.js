import { useState, useEffect } from 'react';
import { FaEnvelope, FaUserCircle, FaBell, FaTachometerAlt } from 'react-icons/fa';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [messageEmail, setMessageEmail] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [showStatusModalId, setShowStatusModalId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  useEffect(() => {
    fetch('http://192.168.8.229:8000/api/truck-requests')
      .then((response) => (response.ok ? response.json() : Promise.reject('Error fetching')))
      .then((data) => setOrders(data.data))
      .catch((error) => console.error('Fetch error:', error));

    fetch('http://192.168.8.229:8000/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications && data.notifications.length > 0) {
          setHasNewNotification(true);
        }
      })
      .catch((err) => console.error('Notification check error:', err));
  }, []);

  const handleNotificationClick = async () => {
    try {
      const response = await fetch('http://192.168.8.229:8000/api/notifications');
      const data = await response.json();
      if (data.notifications && data.notifications.length > 0) {
        const latest = data.notifications[0];
        alert(`New Order from ${latest.data?.user_name || 'Unknown User'} - Order ID: ${latest.data?.order_id}`);
        setHasNewNotification(false);
        await fetch(`http://192.168.8.229:8000/api/notifications/${latest.id}`, {
          method: 'DELETE',
        });
      } else {
        alert('No new notifications');
      }
    } catch (error) {
      console.error('Notification fetch error:', error);
      alert('Failed to load notifications');
    }
  };

  const sendEmail = () => {
    fetch('http://192.168.8.229:8000/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: messageEmail,
        subject: messageSubject,
        message: messageBody,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        alert('Message sent successfully!');
        setShowEmailModal(false);
        setMessageBody('');
        setMessageSubject('');
      })
      .catch((err) => {
        console.error('Email send error:', err);
        alert('Failed to send message');
      });
  };

  return (
    <div style={styles.dashboard}>
      <div style={styles.sidebar}>
        <div style={styles.accountIcon}>
          <FaUserCircle size={40} />
        </div>
        <div style={{ ...styles.sidebarItem, ...styles.activeItem, borderRadius: '25px' }}>
          <FaTachometerAlt style={{ marginRight: '8px' }} />
          Dashboard
        </div>
        <div style={styles.sidebarItem} onClick={handleNotificationClick}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <FaBell style={{ marginRight: '8px' }} />
            {hasNewNotification && (
              <span
                style={{
                  position: 'absolute',
                  top: '0px',
                  left: '12px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'red',
                  borderRadius: '50%',
                }}
              />
            )}
            <span>Notifications</span>
          </div>
        </div>
      </div>
      <div style={styles.mainContent}>
        <div style={styles.cardsWrapper}>
          <div style={{ ...styles.card, ...styles.total }}>Total Orders<br />{orders.length}</div>
          <div style={{ ...styles.card, ...styles.pending }}>
            Pending<br />{orders.filter((o) => o.status?.toLowerCase() === 'pending').length}
          </div>
          <div style={{ ...styles.card, ...styles.progress }}>
            In Progress<br />{orders.filter((o) => o.status?.toLowerCase() === 'in progress').length}
          </div>
        </div>
        <h2>Order List</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Client</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Time</th>
              <th style={styles.th}>Details</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td style={styles.td}>Order ID: {order.id}</td>
                <td style={styles.td}>
                  {order.user?.name}
                  <FaEnvelope
                    title="Send Message"
                    style={styles.emailIcon}
                    onClick={() => {
                      setMessageEmail(order.user?.email);
                      setShowEmailModal(true);
                    }}
                  />
                </td>
                <td style={styles.td}>{order.created_at?.split('T')[0]}</td>
                <td style={styles.td}>{order.pickup_time}</td>
                <td style={styles.td}>
                  <button onClick={() => setSelectedOrder(order)} style={styles.detailsBtn}>
                    Details
                  </button>
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.status,
                      background:
                        order.status?.toLowerCase() === 'pending'? '#ccc'
                        : order.status?.toLowerCase() === 'accepted'? '#4A91D0'
                        : order.status?.toLowerCase() === 'in progress'? 'gold'
                        : order.status?.toLowerCase() === 'cancelled'? 'red'
                        : order.status?.toLowerCase() === 'delivered'? 'green'
                        : '#aaa',}}
                  >
                  {order.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <button
                    style={{
                      ...styles.updateBtn,
                      opacity: order.status?.toLowerCase() === 'cancelled' ? 0.5 : 1,
                      cursor: order.status?.toLowerCase() === 'cancelled' ? 'not-allowed' : 'pointer',}}
                    disabled={order.status?.toLowerCase() === 'cancelled'}
                    onClick={() => {
                      if (order.status?.toLowerCase() !== 'cancelled') {
                        setShowStatusModalId(order.id);}}}>Update</button>
                  {showStatusModalId === order.id && (
                    <div style={styles.statusModal}>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        style={styles.select}>
                        <option value="">Select Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accept</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancel</option>
                      </select>
                      <button
                        style={styles.confirmBtn}
                        onClick={() => {
                          fetch(`http://192.168.8.229:8000/api/truck-requests/${order.id}/update-status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus }),})
                            .then((res) => res.json())
                            .then(() => {
                              const updated = orders.map((o) =>
                                o.id === order.id ? { ...o, status: newStatus } : o);
                              setOrders(updated);
                              setShowStatusModalId(null);
                              setNewStatus('');})
                            .catch((err) => {
                              console.error('Failed to update status', err);
                              alert('Error updating status');});}}>Confirm</button>
                    </div>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showEmailModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Send Message</h3>
            <p><strong>To:</strong> {messageEmail}</p>
            <input
              type="text"
              placeholder="Subject"
              value={messageSubject}
              onChange={(e) => setMessageSubject(e.target.value)}
              style={styles.input}
            />
            <textarea
              placeholder="Type your message..."
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              style={styles.textarea}
            />
            <div style={styles.actions}>
              <button style={styles.sendBtn} onClick={sendEmail}>
                Send
              </button>
              <button style={styles.closeBtn} onClick={() => setShowEmailModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedOrder && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Order Details</h3>
            <p><strong>Client:</strong> {selectedOrder.user?.name}</p>
            <p><strong>Pickup Location:</strong> {selectedOrder.pickup_location}</p>
            <p><strong>Dropoff Location:</strong> {selectedOrder.dropoff_location}</p>
            <p><strong>Pickup Time:</strong> {selectedOrder.pickup_time}</p>
            <p><strong>Delivery Time:</strong> {selectedOrder.delivery_time}</p>
            <p><strong>Truck Type:</strong> {selectedOrder.truck_type}</p>
            <p><strong>Weight:</strong> {selectedOrder.weight}</p>
            <p><strong>Cargo Type:</strong> {selectedOrder.cargo_type}</p>
            <p><strong>Note:</strong> {selectedOrder.note || '—'}</p>
            <button onClick={() => setSelectedOrder(null)} style={styles.closeBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
dashboard: {
 display: 'flex', 
 fontFamily: 'sans-serif' },
sidebar: { 
 width: '200px', 
 backgroundColor: '#e0e0e0', 
 padding: '1rem', 
 minHeight: '100vh' },
accountIcon: { 
 textAlign: 'center', 
 marginBottom: '2rem' },
sidebarItem: { 
 padding: '0.8rem', 
 marginBottom: '0.5rem', 
 cursor: 'pointer' },
activeItem: { 
 backgroundColor: '#6a4b7e', 
 color: 'white' },
mainContent: { 
 flexGrow: 1, 
 padding: '2rem' },
cardsWrapper: {
 display: 'flex', 
 justifyContent: 'center', 
 gap: '2rem', 
 marginBottom: '2rem' },
card: {
 padding: '1rem', 
 color: 'white', 
 fontWeight: 'bold', 
 textAlign: 'center', 
 width: '180px', 
 borderRadius: '8px', 
 fontSize: '18px' },
total: { 
 backgroundColor: '#6a4b7e' },
pending: { 
 backgroundColor: 'gold', 
 color: 'black' },
  
progress: { 
 backgroundColor: 'gold', 
 color: 'black' },
table: { 
 width: '100%', borderCollapse: 'collapse' },
th: { 
 padding: '0.75rem', 
 textAlign: 'left', 
 borderBottom: '1px solid #ddd' },
td: { 
 padding: '0.75rem', 
 textAlign: 'left', 
 borderBottom: '1px solid #ddd' },
updateBtn: { 
 backgroundColor: '#6a4b7e', 
 color: 'white', 
 border: 'none', 
 padding: '0.5rem 1rem', 
 cursor: 'pointer' },
status: { 
 padding: '0.4rem 0.8rem', 
 borderRadius: '4px', 
 color: 'white', 
 fontWeight: 'bold', 
 display: 'inline-block', 
 marginBottom: '0.3rem' },
emailIcon: { 
 marginLeft: '8px', 
 cursor: 'pointer', 
 color: '#555' },
modalOverlay: { 
 position: 'fixed', 
 top: 0, 
 left: 0, 
 right: 0, 
 bottom: 0, 
 backgroundColor: 'rgba(0,0,0,0.5)', 
 display: 'flex', 
 alignItems: 'center', 
 justifyContent: 'center' },
modalContent: { 
 background: '#fff', 
 padding: '2rem', 
 borderRadius: '10px', 
 width: '400px', 
 textAlign: 'left' },
input: { 
 width: '100%', 
 padding: '0.5rem', 
 marginBottom: '1rem', 
 fontSize: '16px' },
textarea: { 
 width: '100%', 
 height: '100px', 
 padding: '0.5rem', 
 fontSize: '16px', 
 marginBottom: '1rem' },
actions: { 
 display: 'flex', 
 justifyContent: 'flex-end', 
 gap: '1rem' },
sendBtn: { 
 padding: '0.5rem 1rem', 
 backgroundColor: '#6a4b7e', 
 color: 'white', 
 border: 'none', 
 cursor: 'pointer' },
closeBtn: { 
 padding: '0.5rem 1rem', 
 backgroundColor: '#aaa', 
 color: 'white', 
 border: 'none', 
 cursor: 'pointer' },
  statusModal: {
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  select: {
    padding: '5px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  confirmBtn: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    padding: '5px 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};


