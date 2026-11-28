
// ==========================================
// GAMINGWORLD - MAIN JAVASCRIPT
// ==========================================

const SUPABASE_URL = "https://ijzjaqrspxsuixjjkuyg.supabase.co";

// Paste your Supabase PUBLISHABLE KEY between the quotes:
const SUPABASE_KEY = "sb_publishable_RNgTkXKdoUvlU-4gmII9zA_Y5YckBcV";

const sbClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const SITE_URL = "https://yogiritaka.github.io/Gamingworld/";

let currentUser = null;
let currentProfile = null;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function message(element, text) {
  if (element) element.textContent = text;
}

function avatarIcon(avatar) {
  const avatars = {
    Hero: "🦸",
    Ninja: "🥷",
    King: "👑",
    Dragon: "🐉",
    Gamer: "🎮"
  };
  return avatars[avatar] || "🎮";
}

const games = [
  "Minecraft",
  "Free Fire",
  "BGMI",
  "Roblox",
  "Fortnite",
  "Call of Duty",
  "GTA V",
  "Valorant"
];

// ==========================================
// AUTHENTICATION
// ==========================================

async function renderAuthentication() {
  const area = document.getElementById("authArea");
  if (!area) return;

  if (currentUser) {
    area.innerHTML = `
      <p>Logged in as <strong>${safe(currentUser.email)}</strong></p>
      <button id="logoutButton">Logout</button>
    `;

    document.getElementById("logoutButton").onclick = logout;
    return;
  }

  area.innerHTML = `
    <h2>Login / Create Account</h2>

    <input id="authEmail" type="email" placeholder="Email address">

    <input id="authPassword" type="password" placeholder="Password">

    <button id="loginButton">Login</button>
    <button id="signupButton" class="secondary">Create Account</button>

    <p id="authMessage"></p>
  `;

  document.getElementById("loginButton").onclick = login;
  document.getElementById("signupButton").onclick = signup;
}

async function login() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const output = document.getElementById("authMessage");

  if (!email || !password) {
    message(output, "Enter your email and password.");
    return;
  }

  const { error } = await sbClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    message(output, error.message);
    return;
  }

  location.reload();
}

async function signup() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const output = document.getElementById("authMessage");

  if (!email || !password) {
    message(output, "Enter your email and password.");
    return;
  }

  const { error } = await sbClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: SITE_URL
    }
  });

  if (error) {
    message(output, error.message);
  } else {
    message(output, "Check your email to confirm your account.");
  }
}

async function logout() {
  await sbClient.auth.signOut();
  location.reload();
}

// ==========================================
// PROFILE
// ==========================================

async function loadProfile() {
  if (!currentUser) return;

  const { data, error } = await sbClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  currentProfile = data;

  const area = document.getElementById("profileArea");
  if (!area) return;

  area.innerHTML = `
    <h2>My Gamer Profile</h2>

    <p>${avatarIcon(data?.avatar)} Your avatar</p>

    <label>Gamer Name</label>
    <input id="gamerName" value="${safe(data?.username || "")}"
      placeholder="Enter gamer name">

    <label>Choose Avatar</label>
    <select id="gamerAvatar">
      ${["Hero", "Ninja", "King", "Dragon", "Gamer"].map(a =>
        `<option value="${a}" ${data?.avatar === a ? "selected" : ""}>${a}</option>`
      ).join("")}
    </select>

    <label>Favourite Game</label>
    <select id="favoriteGame">
      ${games.map(g =>
        `<option value="${g}" ${data?.favorite_game === g ? "selected" : ""}>${g}</option>`
      ).join("")}
    </select>

    <button id="saveProfileButton">Save Profile</button>
    <p id="profileMessage"></p>
  `;

  document.getElementById("saveProfileButton").onclick = saveProfile;
}

async function saveProfile() {
  const username = document.getElementById("gamerName").value.trim();
  const avatar = document.getElementById("gamerAvatar").value;
  const favorite_game = document.getElementById("favoriteGame").value;
  const output = document.getElementById("profileMessage");

  if (!username) {
    message(output, "Please enter a gamer name.");
    return;
  }

  const { error } = await sbClient
    .from("profiles")
    .upsert({
      id: currentUser.id,
      username,
      avatar,
      favorite_game,
      updated_at: new Date().toISOString()
    });

  if (error) {
    message(output, error.message);
    return;
  }

  message(output, "Profile saved successfully!");
  loadProfile();
}

// ==========================================
// GAME CHANNELS
// ==========================================

async function loadChannels() {
  const grid = document.getElementById("channelGrid");
  if (!grid) return;

  const { data: approvedChannels, error } = await sbClient
  .from("gamingworld_channels")
  .select("name");

if (error) {
  console.error("Could not load approved channels:", error.message);
}

const allGames = [...games];

(approvedChannels || []).forEach(channel => {
  const alreadyExists = allGames.some(
    game => game.toLowerCase() === channel.name.toLowerCase()
  );

  if (!alreadyExists) {
    allGames.push(channel.name);
  }
});

grid.innerHTML = allGames.map(game =>
    <div class="channel-card">
      <h3>🎮 ${safe(game)}</h3>
      <p>Join the ${safe(game)} gaming community.</p>
      <button onclick="openChannel('${safe(game)}')">
        Open Channel
      </button>
    </div>
  `).join("");

  const params = new URLSearchParams(location.search);
  const selectedGame = params.get("game");

  if (selectedGame) {
    const title = document.getElementById("channelTitle");
    const description = document.getElementById("channelDescription");

    if (title) title.textContent = "🎮 " + selectedGame;
    if (description) {
      description.textContent = "Welcome to the " + selectedGame + " channel!";
    }
  }
}

function openChannel(game) {
  location.href = "channel.html?game=" + encodeURIComponent(game);
}

// ==========================================
// COMMUNITY POSTS
// ==========================================

async function loadPosts() {
  const feed = document.getElementById("communityFeed");
  if (!feed) return;

  let html = "";

  if (currentUser) {
    html += `
      <div class="post-card">
        <h3>Create a Post</h3>

        <select id="postGame">
          ${games.map(g => `<option value="${g}">${safe(g)}</option>`).join("")}
        </select>

        <textarea id="postMessage" placeholder="Share your gaming moment..."></textarea>

        <button id="publishPostButton">Publish Post</button>
        <p id="postMessageStatus"></p>
      </div>
    `;
  } else {
    html += `<p>Please log in to create posts.</p>`;
  }

  const { data, error } = await sbClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    feed.innerHTML = html + "<p>Could not load posts: " + safe(error.message) + "</p>";
    return;
  }

  if (!data || data.length === 0) {
    html += "<p>No community posts yet. Be the first to post!</p>";
  } else {
    for (const post of data) {
      html += await renderPost(post);
    }
  }

  feed.innerHTML = html;

  const publishButton = document.getElementById("publishPostButton");
  if (publishButton) publishButton.onclick = createPost;
}

async function createPost() {
  const game = document.getElementById("postGame").value;
  const content = document.getElementById("postMessage").value.trim();
  const output = document.getElementById("postMessageStatus");

  if (!content) {
    message(output, "Write something first.");
    return;
  }

  const username = currentProfile?.username || currentUser.email;

  const { error } = await sbClient
    .from("posts")
    .insert({
      user_id: currentUser.id,
      username,
      game,
      message: content
    });

  if (error) {
    message(output, error.message);
    return;
  }

  loadPosts();
}

async function renderPost(post) {
  const isOwner = currentUser && currentUser.id === post.user_id;

  const { data: comments } = await sbClient
    .from("comments")
    .select("*")
    .eq("post_id", post.id)
    .order("created_at", { ascending: true });

  let commentHTML = (comments || []).map(comment => `
    <p>
      <strong>${safe(comment.username)}</strong>:
      ${safe(comment.message)}
      ${currentUser && currentUser.id === comment.user_id
        ? `<button onclick="deleteComment('${comment.id}')">Delete</button>`
        : ""}
    </p>
  `).join("");

  return `
    <div class="post-card">
      <h3>${safe(post.username)}</h3>
      <p>🎮 ${safe(post.game)}</p>
      <p>${safe(post.message)}</p>

      <p>❤️ ${Number(post.likes) || 0} Likes</p>

      ${currentUser
        ? `<button onclick="likePost('${post.id}')">Like</button>`
        : `<p>Log in to like this post.</p>`}

      ${isOwner
        ? `<button onclick="deletePost('${post.id}')">Delete Post</button>`
        : ""}

      <div class="comments">
        <h4>Comments</h4>
        ${commentHTML}

        ${currentUser ? `
          <input id="comment-${post.id}" placeholder="Write a comment">
          <button onclick="addComment('${post.id}')">Comment</button>
        ` : ""}
      </div>
    </div>
  `;
}

async function likePost(postId) {
  if (!currentUser) return alert("Please log in first.");

  const { error } = await sbClient
    .from("post_likes")
    .insert({
      post_id: postId,
      user_id: currentUser.id
    });

  if (error && error.code !== "23505") {
    alert(error.message);
  }

  loadPosts();
}

async function addComment(postId) {
  const input = document.getElementById("comment-" + postId);
  const content = input.value.trim();

  if (!content) return;

  const { error } = await sbClient
    .from("comments")
    .insert({
      post_id: postId,
      user_id: currentUser.id,
      username: currentProfile?.username || currentUser.email,
      message: content
    });

  if (error) {
    alert(error.message);
    return;
  }

  loadPosts();
}

async function deleteComment(commentId) {
  if (!confirm("Delete this comment?")) return;

  const { error } = await sbClient
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", currentUser.id);

  if (error) alert(error.message);
  else loadPosts();
}

async function deletePost(postId) {
  if (!confirm("Delete this post?")) return;

  const { error } = await sbClient
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", currentUser.id);

  if (error) alert(error.message);
  else loadPosts();
}

// ==========================================
// COMMUNITY GAMERS AND FOLLOWING
// ==========================================

async function loadCommunityGamers() {
  const area = document.getElementById("gamersList");
  if (!area) return;

  const { data: profiles, error } = await sbClient
    .from("profiles")
    .select("*")
    .order("username");

  if (error) {
    area.textContent = error.message;
    return;
  }

  if (!profiles || profiles.length === 0) {
    area.textContent = "No gamers found yet.";
    return;
  }

  let html = "";

  for (const gamer of profiles) {
    if (currentUser && gamer.id === currentUser.id) continue;

    const { data: counts } = await sbClient.rpc("get_follow_counts", {
      profile_id: gamer.id
    });

    const followerCount = counts?.[0]?.follower_count ?? 0;
    const followingCount = counts?.[0]?.following_count ?? 0;

    let following = false;

    if (currentUser) {
      const { data: existing } = await sbClient
        .from("follows")
        .select("id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", gamer.id)
        .maybeSingle();

      following = !!existing;
    }

    html += `
      <div class="gamer-card">
        <h3>${avatarIcon(gamer.avatar)} ${safe(gamer.username)}</h3>
        <p>Favourite game: ${safe(gamer.favorite_game || "Not selected")}</p>
        <p>Followers: ${followerCount}</p>
        <p>Following: ${followingCount}</p>

        ${currentUser ? `
          <button onclick="toggleFollow('${gamer.id}', ${following})">
            ${following ? "Unfollow" : "Follow"}
          </button>
        ` : `<p>Log in to follow gamers.</p>`}
      </div>
    `;
  }

  area.innerHTML = html || "<p>No other gamers found.</p>";
}

async function toggleFollow(gamerId, following) {
  if (!currentUser) return;

  let result;

  if (following) {
    result = await sbClient
      .from("follows")
      .delete()
      .eq("follower_id", currentUser.id)
      .eq("following_id", gamerId);
  } else {
    result = await sbClient
      .from("follows")
      .insert({
        follower_id: currentUser.id,
        following_id: gamerId
      });
  }

  if (result.error) {
    alert(result.error.message);
    return;
  }

  loadCommunityGamers();
}

// ==========================================
// NOTIFICATIONS
// ==========================================

async function loadNotificationSettings() {
  const area = document.getElementById("notificationSettings");
  if (!area || !currentUser) return;

  const { data, error } = await sbClient
    .from("notification_settings")
    .select("*")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  if (error) {
    area.textContent = error.message;
    return;
  }

  const settings = data || {
    all_enabled: true,
    likes_enabled: true,
    comments_enabled: true,
    followers_enabled: true,
    channel_posts_enabled: true
  };

  area.innerHTML = `
    <h2>Notification Settings</h2>

    <label>
      <input type="checkbox" id="all_enabled" ${settings.all_enabled ? "checked" : ""}>
      All Notifications
    </label>

    <label>
      <input type="checkbox" id="likes_enabled" ${settings.likes_enabled ? "checked" : ""}>
      Likes
    </label>

    <label>
      <input type="checkbox" id="comments_enabled" ${settings.comments_enabled ? "checked" : ""}>
      Comments
    </label>

    <label>
      <input type="checkbox" id="followers_enabled" ${settings.followers_enabled ? "checked" : ""}>
      New Followers
    </label>

    <label>
      <input type="checkbox" id="channel_posts_enabled" ${settings.channel_posts_enabled ? "checked" : ""}>
      Channel Posts
    </label>

    <button id="saveNotificationSettings">Save Settings</button>
    <p id="settingsMessage"></p>
  `;

  document.getElementById("all_enabled").onchange = event => {
    ["likes_enabled", "comments_enabled", "followers_enabled", "channel_posts_enabled"]
      .forEach(id => {
        document.getElementById(id).disabled = !event.target.checked;
      });
  };

  document.getElementById("saveNotificationSettings").onclick =
    saveNotificationSettings;
}

async function saveNotificationSettings() {
  const settings = {
    user_id: currentUser.id,
    all_enabled: document.getElementById("all_enabled").checked,
    likes_enabled: document.getElementById("likes_enabled").checked,
    comments_enabled: document.getElementById("comments_enabled").checked,
    followers_enabled: document.getElementById("followers_enabled").checked,
    channel_posts_enabled: document.getElementById("channel_posts_enabled").checked,
    updated_at: new Date().toISOString()
  };

  const { error } = await sbClient
    .from("notification_settings")
    .upsert(settings);

  message(
    document.getElementById("settingsMessage"),
    error ? error.message : "Notification settings saved!"
  );
}

async function loadNotifications() {
  const area = document.getElementById("notificationsList");
  if (!area) return;

  if (!currentUser) {
    area.textContent = "Please log in to see your notifications.";
    return;
  }

  const { data, error } = await sbClient
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    area.textContent = error.message;
    return;
  }

  if (!data || data.length === 0) {
    area.textContent = "You have no notifications yet.";
    return;
  }

  area.innerHTML = data.map(notification => `
    <div class="notification-card">
      <p>${safe(notification.message)}</p>
      <small>${new Date(notification.created_at).toLocaleString()}</small>
      ${notification.read_at
        ? "<p>Read</p>"
        : `<button onclick="markNotificationRead('${notification.id}')">Mark as Read</button>`}
    </div>
  `).join("");
}

async function markNotificationRead(id) {
  const { error } = await sbClient
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) alert(error.message);
  else loadNotifications();
}

// ==========================================
// START GAMINGWORLD
// ==========================================

async function startGamingWorld() {
  if (!window.supabase || SUPABASE_KEY.includes("PASTE_YOUR")) {
    console.error("Please add your Supabase publishable key to app.js.");
    return;
  }

  const { data, error } = await sbClient.auth.getUser();

  if (error) console.error(error);

  currentUser = data?.user || null;

  await renderAuthentication();

  if (currentUser) {
    await loadProfile();
    await loadNotificationSettings();
  }

  await loadChannels();
  await loadPosts();
  await loadCommunityGamers();
  await loadNotifications();
}
function openChannelRequest() {
  const existingForm = document.getElementById("channelRequestModal");

  if (existingForm) {
    existingForm.style.display = "flex";
    return;
  }

  const modal = document.createElement("div");
  modal.id = "channelRequestModal";
  modal.className = "channel-request-modal";
modal.style.cssText = `
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
  padding: 20px;
`;
  modal.innerHTML = `
    <div class="channel-request-box" style="background:#171d2d; border:1px solid #526da8; border-radius:14px; padding:25px; width:100%; max-width:450px; color:white; box-sizing:border-box;">
      <h2>🎮 Request a New Channel</h2>

      <label>Channel name</label>
      <input id="requestedChannelName"
             type="text"
             placeholder="Example: Black Myth Wukong"
             maxlength="50">

      <label>Why do you want this channel? (Optional)</label>
      <textarea id="requestedChannelReason"
                placeholder="Tell us about your request..."
                maxlength="300"></textarea>

      <button onclick="submitChannelRequest()">
        Submit Request
      </button>

      <button onclick="document.getElementById('channelRequestModal').remove()">
        Cancel
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}
async function submitChannelRequest() {
  const name = document.getElementById("requestedChannelName").value.trim();
  const reason = document.getElementById("requestedChannelReason").value.trim();

  if (!name) {
    alert("Please enter a channel name.");
    return;
  }

  const { data: { user }, error: userError } =
    await sbClient.auth.getUser();

  if (userError || !user) {
    alert("Please sign in before requesting a channel.");
    return;
  }

  const existingChannel = games.find(game => {
  const gameName = typeof game === "string" ? game : game?.name;
  return gameName && gameName.toLowerCase() === name.toLowerCase();
});

  if (existingChannel) {
    alert("This channel already exists on GamingWorld!");
    return;
  }

  const { error } = await sbClient
    .from("channel_requests")
    .insert({
      user_id: user.id,
      channel_name: name,
      reason: reason || null
    });

  if (error) {
    alert("Request failed: " + error.message);
    return;
  }

  alert("Your channel request has been submitted!");

  document.getElementById("channelRequestModal").remove();
}

async function loadAdminRequests() {
  const container = document.getElementById("adminRequests");
  if (!container) return;

  const { data: { user }, error: authError } =
    await sbClient.auth.getUser();

  if (authError || !user) {
    container.innerHTML = "<p>Please sign in to continue.</p>";
    return;
  }

  const { data: isAdmin, error: adminError } =
    await sbClient.rpc("is_gamingworld_admin");

  if (adminError || !isAdmin) {
    container.innerHTML = "<p>Access denied. Admins only.</p>";
    return;
  }

  const { data: requests, error } = await sbClient
    .from("channel_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = "<p>Could not load requests: " +
      error.message + "</p>";
    return;
  }

  if (!requests || requests.length === 0) {
    container.innerHTML = "<p>No channel requests yet.</p>";
    return;
  }

  container.innerHTML = requests.map(request => `
    <div class="channel-request-box" style="margin:15px 0; color:white;">
      <h3>${escapeHTML(request.channel_name)}</h3>
      <p>${escapeHTML(request.reason || "No reason provided")}</p>
      <p>Status: ${escapeHTML(request.status)}</p>
      ${request.status === "pending" ? `
        <button onclick="approveChannelRequest(${request.id})">
          Approve
        </button>
        <button onclick="rejectChannelRequest(${request.id})">
          Reject
        </button>
      ` : ""}
    </div>
  `).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

async function approveChannelRequest(requestId) {
  if (!confirm("Approve this channel request?")) return;

  const { error } = await sbClient.rpc("approve_channel_request", {
    request_id: requestId
  });

  if (error) {
    alert("Approval failed: " + error.message);
    return;
  }

  alert("Channel approved successfully!");
  loadAdminRequests();
}

async function rejectChannelRequest(requestId) {
  if (!confirm("Reject this channel request?")) return;

  const { error } = await sbClient.rpc("reject_channel_request", {
    request_id: requestId
  });

  if (error) {
    alert("Rejection failed: " + error.message);
    return;
  }

  alert("Request rejected.");
  loadAdminRequests();
}

startGamingWorld();

if (document.getElementById("adminRequests")) {
  loadAdminRequests();
}
