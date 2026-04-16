import React, { useState, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import './UserProfile.css';

const UserProfile: React.FC = () => {
    const { username, logout } = useAuthStore();
    const navigate = useNavigate();
    const [showEmail, setShowEmail] = useState(false);
    
    // Edit Profile State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
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

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setAvatarUrl(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
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
                                    <div 
                                      className="profile-hero-avatar"
                                      onClick={handleAvatarClick}
                                      style={{ cursor: 'pointer', backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', color: avatarUrl ? 'transparent' : 'white' }}
                                    >
                                        {!avatarUrl && (username ? username.charAt(0).toUpperCase() : 'U')}
                                        <div className="status-indicator"></div>
                                        <div className="avatar-upload-overlay">
                                            <span>Change</span>
                                        </div>
                                    </div>
                                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
                                    
                                    <div className="profile-hero-nameblock">
                                        <span className="profile-display-name">{username}</span>
                                        <span className="profile-tag">#{username || 'User'}</span>
                                    </div>
                                    <button 
                                        className="btn-primary" 
                                        style={{ height: '32px', padding: '0 16px', flexShrink: 0, whiteSpace: 'nowrap', width: 'auto', backgroundColor: isEditingProfile ? '#23a559' : 'var(--brand)' }}
                                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                                    >
                                        {isEditingProfile ? 'Save Profile' : 'Edit User Profile'}
                                    </button>
                                </div>

                                <div className="profile-hero-details">
                                    <div className="detail-row">
                                        <div className="detail-col">
                                            <span className="detail-label">DISPLAY NAME</span>
                                            {isEditingProfile ? (
                                                <input defaultValue={username ?? ''} style={{ padding: '6px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--bg-secondary)', color: 'white', marginTop: '4px' }} />
                                            ) : (
                                                <span className="detail-value">{username}</span>
                                            )}
                                        </div>
                                        {!isEditingProfile && <button className="btn-secondary" onClick={() => setIsEditingProfile(true)}>Edit</button>}
                                    </div>
                                    <div className="detail-row">
                                        <div className="detail-col">
                                            <span className="detail-label">USERNAME</span>
                                            {isEditingProfile ? (
                                                <input defaultValue={username ?? ''} style={{ padding: '6px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--bg-secondary)', color: 'white', marginTop: '4px' }} />
                                            ) : (
                                                <span className="detail-value">{username}</span>
                                            )}
                                        </div>
                                        {!isEditingProfile && <button className="btn-secondary" onClick={() => setIsEditingProfile(true)}>Edit</button>}
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
                                <div className="auth-action-row" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                     {!isChangingPassword ? (
                                        <button className="btn-primary" style={{ width: '160px' }} onClick={() => setIsChangingPassword(true)}>
                                            Change Password
                                        </button>
                                     ) : (
                                         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
                                            <input type="password" placeholder="Current Password" style={{ padding: '8px 12px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--bg-tertiary)', color: 'white' }} />
                                            <input type="password" placeholder="New Password" style={{ padding: '8px 12px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--bg-tertiary)', color: 'white' }} />
                                            <input type="password" placeholder="Confirm New Password" style={{ padding: '8px 12px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--bg-tertiary)', color: 'white' }} />
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                <button className="btn-primary" style={{ flex: 1, backgroundColor: '#23a559' }} onClick={handlePasswordChange}>Save</button>
                                                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsChangingPassword(false)}>Cancel</button>
                                            </div>
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
