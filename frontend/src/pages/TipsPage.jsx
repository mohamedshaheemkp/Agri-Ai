import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Lightbulb, 
  MessageSquare, 
  CornerDownRight, 
  Zap, 
  Filter, 
  ArrowDownWideNarrow, 
  Heart, 
  Edit3, 
  Trash2, 
  User, 
  ChevronLeft,
  BookOpen,
  Send
} from "lucide-react"; 
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import './TipsPage.css';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { smart_farming_community: "Community Tips", share_tip: "Share your farming tip...", your_name: "Farmer Name", add_tip: "Post Tip", reply: "Reply", edit: "Edit", delete: "Delete", save: "Save", cancel: "Cancel", back_to_dashboard: "Dashboard", filter_by_category: "Category", all_categories: "All Categories", sort_by: "Sort:", newest: "Newest", oldest: "Oldest", posted_by: "By", no_tips: "No tips yet in this category. Share yours!", tip_too_short: "Tip should be at least 10 chars.", set_your_name: "Please set your name first." } },
    ml: { translation: { smart_farming_community: "കർഷക കൂട്ടായ്മ", share_tip: "വിവരങ്ങൾ പങ്കിടുക...", your_name: "പേര്", add_tip: "പോസ്റ്റ് ചെയ്യുക", reply: "മറുപടി", edit: "തിരുത്തുക", delete: "നീക്കം ചെയ്യുക", save: "സേവ്", cancel: "റദ്ദാക്കുക", back_to_dashboard: "ഡാഷ്‌ബോർഡ്", filter_by_category: "വിഭാഗം", all_categories: "എല്ലാം", sort_by: "ക്രമം:", newest: "പുതിയത്", oldest: "പഴയത്", posted_by: "കർഷകൻ", no_tips: "കുറിപ്പുകളില്ല. ആദ്യം പങ്കിടുക!", tip_too_short: "കുറിപ്പ് ശൂന്യമായിരിക്കരുത്.", set_your_name: "പേര് നൽകുക" } }
  },
  lng: "en", fallbackLng: "en", interpolation: { escapeValue: false }
});

const EXPANDED_DUMMY_TIPS = [
  { id: 1, user: 'John', category: 'Crops', timestamp: Date.now() - 86400000 * 10, likes: 15, replies: [], text: { en: 'Use crop rotation to improve soil health by preventing nutrient depletion.', ml: 'മണ്ണിലെ പോഷകങ്ങൾ ഇല്ലാതാകുന്നത് തടയാൻ വിള പരിക്രമണം ഉപയോഗിക്കുക.' } },
  { id: 2, user: 'Alice', category: 'Fertilizers', timestamp: Date.now() - 86400000 * 8, likes: 8, replies: [], text: { en: 'Organic fertilizers provide better long-term yield than synthetics.', ml: 'ജൈവവളങ്ങൾ മികച്ച വിളവിന് സഹായിക്കും.' } },
  { id: 3, user: 'Bob', category: 'Pests', timestamp: Date.now() - 86400000 * 6, likes: 22, replies: [], text: { en: 'Neem oil mixed with mild soap water works well as a general repellent.', ml: 'വേപ്പെണ്ണയും സോപ്പ് വെള്ളവും ചേർത്ത മിശ്രിതം കീടങ്ങളെ നശിപ്പിക്കാൻ ഫലപ്രദമാണ്.' } },
];

function TipsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const categories = ['Crops', 'Fertilizers', 'Pests', 'Livestock', 'General'];
  const [language, setLanguage] = useState(i18n.language || 'en'); 
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortOrder, setSortOrder] = useState('newest');
  const [newTip, setNewTip] = useState('');
  const [tips, setTips] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [userName, setUserName] = useState(localStorage.getItem('tipUserName') || '');
  const [likedTips, setLikedTips] = useState(JSON.parse(localStorage.getItem('likedTips')) || {});
  const [editingTipId, setEditingTipId] = useState(null);
  const [editingTipText, setEditingTipText] = useState('');

  useEffect(() => {
    const savedTips = localStorage.getItem("farmingTips");
    if (savedTips) setTips(JSON.parse(savedTips));
    else setTips(EXPANDED_DUMMY_TIPS); 
  }, []);

  useEffect(() => {
    if (tips.length > 0) localStorage.setItem("farmingTips", JSON.stringify(tips));
    localStorage.setItem('likedTips', JSON.stringify(likedTips));
  }, [tips, likedTips]);

  useEffect(() => { localStorage.setItem('tipUserName', userName); }, [userName]);

  const handleAddTip = () => {
    if (!userName.trim() || newTip.trim().length < 10) return;
    const tipObj = {
      id: Date.now(),
      user: userName,
      category: selectedCategory === 'All Categories' ? categories[0] : selectedCategory,
      timestamp: Date.now(),
      text: { en: newTip, ml: newTip }, 
      replies: [],
      likes: 0
    };
    setTips([tipObj, ...tips]);
    setNewTip('');
  };

  const handleLikeTip = (id) => {
    if (!userName.trim()) return;
    const hasLiked = likedTips[id];
    const updatedTips = tips.map(tip => tip.id === id ? { ...tip, likes: tip.likes + (hasLiked ? -1 : 1) } : tip);
    setTips(updatedTips);
    setLikedTips(prev => ({ ...prev, [id]: !hasLiked }));
  };

  const filteredAndSortedTips = useMemo(() => {
    let result = tips;
    if (selectedCategory !== 'All Categories') result = result.filter(tip => tip.category === selectedCategory);
    result.sort((a, b) => sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
    return result;
  }, [tips, selectedCategory, sortOrder]);

  const formatTs = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff}d ago`;
  };

  return (
    <div className="tips-page-modern reveal-anim">
      <div className="page-header-flex">
        <div className="header-text">
          <div className="header-icon-small"><BookOpen size={24} /></div>
          <div>
            <h1>{t('smart_farming_community')}</h1>
            <p className="subtitle">Grow smarter by learning from fellow farmers.</p>
          </div>
        </div>
        <div className="header-actions-market">
           <div className="language-switcher-modern">
            <button className={`switch-pill ${language === 'en' ? 'active' : ''}`} onClick={() => { i18n.changeLanguage('en'); setLanguage('en'); }}>EN</button>
            <button className={`switch-pill ${language === 'ml' ? 'active' : ''}`} onClick={() => { i18n.changeLanguage('ml'); setLanguage('ml'); }}>ML</button>
          </div>
          <button className="btn-back-soft" onClick={() => navigate('/dashboard')}><ChevronLeft size={16} /> Dashboard</button>
        </div>
      </div>

      <div className="user-setup-card">
         <User size={18} className="text-success" />
         <input type="text" placeholder={t('your_name')} value={userName} onChange={(e) => setUserName(e.target.value)} />
      </div>

      <div className="card-ngebon tip-form-card">
         <div className="row g-3">
            <div className="col-md-3">
               <span className="info-label-small">Category</span>
               <select className="form-select-modern" value={selectedCategory === 'All Categories' ? categories[0] : selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
               </select>
            </div>
            <div className="col-md-7">
               <span className="info-label-small">Knowledge Snippet</span>
               <textarea className="form-control-modern" placeholder={t('share_tip')} value={newTip} onChange={(e) => setNewTip(e.target.value)} disabled={!userName.trim()} />
            </div>
            <div className="col-md-2 d-flex align-items-end">
               <button className="btn-primary-modern w-100" onClick={handleAddTip} disabled={!userName.trim() || newTip.trim().length < 10}>
                  <Zap size={16} /> Post
               </button>
            </div>
         </div>
      </div>

      <div className="tips-grid-modern">
        {filteredAndSortedTips.map((tip) => (
          <div key={tip.id} className="card-ngebon tip-card-ngebon">
            <div className="tip-header">
               <span className="badge-soft">{tip.category}</span>
               <span className="ts-small">{formatTs(tip.timestamp)}</span>
            </div>
            <p className="tip-content-txt">{tip.text[language]}</p>
            
            <div className="tip-footer-modern">
               <div className="tip-author-info">
                  <div className="author-avatar-small">{tip.user.charAt(0)}</div>
                  <span className="author-name-small">{tip.user}</span>
               </div>
               <div className="tip-actions-row">
                  <button className={`action-btn-soft ${likedTips[tip.id] ? 'liked' : ''}`} onClick={() => handleLikeTip(tip.id)}>
                     <Heart size={16} fill={likedTips[tip.id] ? 'currentColor' : 'none'} /> {tip.likes}
                  </button>
                  <button className="action-btn-soft"><MessageSquare size={16} /> {tip.replies.length}</button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TipsPage;