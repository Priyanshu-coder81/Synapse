import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import './UserProfile.css';

const UserProfile: React.FC = () => {
    const { username, logout } = useAuthStore();
    const navigate = useNavigate();
    const [showEmail, setShowEmail] = useState(false);
    
    // Tab State
    const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'appearance'>('account');
    
    // Change Password State
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [pwdStatus, setPwdStatus] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handlePasswordChange = () => {
        setPwdStatus('Password successfully updated!');
        setTimeout(() => {
            setIsChangingPassword(false);
            setPwdStatus('');
        }, 2000);
    };

    return (
        <div className="settings-overlay">
            {/* Left Nav Bar */}
            <div className="settings-sidebar">
                <div className="settings-nav-section">
                    <span className="settings-nav-header">USER SETTINGS</span>
                    <div className={`settings-nav-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
                        My Account
                    </div>
                    <div className={`settings-nav-item ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
                        Privacy & Safety
                    </div>
                </div>

                <div className="settings-separator"></div>

                <div className="settings-nav-section">
                    <span className="settings-nav-header">APP SETTINGS</span>
                    <div className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>
                        Appearance
                    </div>
                </div>

                <div className="settings-separator"></div>

                <div className="settings-nav-section">
                    <div className="settings-nav-item danger" onClick={handleLogout}>
                        Log Out
                        <LogOut size={16} />
                    </div>
                </div>
            </div>

            {/* Right Main Content */}
            <div className="settings-content-wrapper">
                <div className="settings-content">
                    <div className="settings-close" onClick={() => navigate(-1)}>
                        <div className="close-button">✕</div>
                        <span>ESC</span>
                    </div>

                    {activeTab === 'account' && (
                        <>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>My Account</h2>
                            
                            <div className="profile-hero-card">
                                <div className="profile-hero-banner"></div>
                                <div className="profile-hero-info">
                                    <div className="profile-hero-avatar">
                                        {username ? username.charAt(0).toUpperCase() : 'U'}
                                        <div className="status-indicator"></div>
                                    </div>
                                    <div className="profile-hero-nameblock">
                                        <span className="profile-display-name">{username}</span>
                                        <span className="profile-tag">#{username || 'User'}</span>
                                    </div>
                                    <button className="btn-primary" style={{ height: '32px', padding: '0 16px', marginLeft: 'auto' }}>Edit User Profile</button>
                                </div>

                                <div className="profile-hero-details">
                                    <div className="detail-row">
                                        <div className="detail-col">
                                            <span className="detail-label">DISPLAY NAME</span>
                                            <span className="detail-value">{username}</span>
                                        </div>
                                        <button className="btn-secondary">Edit</button>
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-col">
                                            <span className="detail-label">USERNAME</span>
                                            <span className="detail-value">{username}</span>
                                        </div>
                                        <button className="btn-secondary">Edit</button>
                                    </div>
                                    <div className="detail-row" style={{ borderBottom: 'none' }}>
                                        <div className="detail-col">
                                            <span className="detail-label">EMAIL</span>
                                            <span className="detail-value">{showEmail ? `${username}@synapse.com` : '*********@synapse.com'}</span>
                                        </div>
                                        <button className="btn-secondary" onClick={() => setShowEmail(!showEmail)}>
                                            {showEmail ? 'Hide' : 'Reveal'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3 className="section-title">Password and Authentication</h3>
                                <div className="auth-action-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                     {!isChangingPassword ? (
                                        <button className="btn-primary" style={{ width: '160px' }} onClick={() => setIsChangingPassword(true)}>
                                            Change Password
                                        </button>
                                     ) : (
                                         <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <input type="password" placeholder="New Password" style={{ padding: '8px 12px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--bg-tertiary)', color: 'white' }} />
                                            <button className="btn-primary" style={{ width: 'auto', backgroundColor: '#23a559' }} onClick={handlePasswordChange}>Save</button>
                                            <button className="btn-secondary" onClick={() => setIsChangingPassword(false)}>Cancel</button>
                                         </div>
                                     )}
                                     {pwdStatus && <span style={{ color: '#23a559', fontSize: '13px', fontWeight: 'bold' }}>{pwdStatus}</span>}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'privacy' && (
                        <>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>Privacy & Safety</h2>
                            
                            <div className="settings-section">
                                <h3 className="section-title">Safe Direct Messaging</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>Automatically scan and delete direct messages you receive that contain explicit media content.</p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--brand)' }}>
                                        <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>Keep me safe</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Scan direct messages from everyone (Recommended).</div>
                                    </div>
                                    <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', cursor: 'pointer', opacity: 0.7 }}>
                                        <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>My friends are nice</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Scan direct messages from everyone unless they are a friend.</div>
                                    </div>
                                    <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', cursor: 'pointer', opacity: 0.7 }}>
                                        <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>Do not scan</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Direct messages will not be scanned for explicit content.</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'appearance' && (
                        <>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}>Appearance</h2>
                            
                            <div className="settings-section">
                                <h3 className="section-title">Theme</h3>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '120px', height: '80px', backgroundColor: '#313338', borderRadius: '8px', border: '2px solid var(--brand)' }}></div>
                                        <span style={{ color: 'var(--text-normal)', fontSize: '14px', fontWeight: 'bold' }}>Dark</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
                                        <div style={{ width: '120px', height: '80px', backgroundColor: '#e3e5e8', borderRadius: '8px', border: '2px solid transparent' }}></div>
                                        <span style={{ color: 'var(--text-normal)', fontSize: '14px', fontWeight: 'bold' }}>Light</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
                                        <div style={{ width: '120px', height: '80px', background: 'linear-gradient(45deg, #090a0f, #231f41)', borderRadius: '8px', border: '2px solid transparent' }}></div>
                                        <span style={{ color: 'var(--text-normal)', fontSize: '14px', fontWeight: 'bold' }}>Sync with PC</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default UserProfile;
