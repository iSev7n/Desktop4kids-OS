// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('system', {
  exit: () => ipcRenderer.invoke('system:exit')
});

function inv(channel, ...args) {
  return ipcRenderer.invoke(channel, ...args).catch(err => {
    const msg = (err && (err.message || err.toString())) || 'Unknown error';
    throw new Error(msg);
  });
}

contextBridge.exposeInMainWorld('fsAPI', {
  list:         (rel = '')               => inv('fs:list', rel),
  readText:     (rel)                    => inv('fs:readText', rel),
  writeText:    (rel, c)                 => inv('fs:writeText', rel, c),
  createFolder: (rel)                    => inv('fs:createFolder', rel),
  delete:       (rel)                    => inv('fs:delete', rel),
  renameOrMove: (fromRel, toRel)         => inv('fs:rename', fromRel, toRel),
  fileUrl:      (rel)                    => inv('fs:fileUrl', rel),
  stat:         (rel)                    => inv('fs:stat', rel),
  openExternal: (rel)                    => inv('fs:openExternal', rel)
});

// Let renderer tell main who the current user is
contextBridge.exposeInMainWorld('accountsBridge', {
  setCurrentUser: (id) => ipcRenderer.invoke('acct:set', id),
  readProfiles:   () => ipcRenderer.invoke('acct:profiles:get').then(s => JSON.parse(s || '[]')),
  writeProfiles:  (list) => ipcRenderer.invoke('acct:profiles:set', JSON.stringify(list ?? [])),
});

// --- AI Mentor bridge (renderer <-> main) ---
function askMentor(payload = {}, onToken) {
  return new Promise((resolve, reject) => {
    const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Stream chunks to the renderer callback
    const onChunk = (_evt, piece) => {
      try { if (typeof onToken === 'function') onToken(String(piece || '')); }
      catch (_) {}
    };

    // Finalize and resolve with full text
    const onDone = (_evt, res) => {
      // cleanup listeners
      ipcRenderer.removeAllListeners(`mentor:chunk:${id}`);
      ipcRenderer.removeAllListeners(`mentor:done:${id}`);

      if (res && res.ok) {
        resolve(String(res.text || ''));
      } else {
        reject(new Error(res?.error || 'Mentor failed'));
      }
    };

    ipcRenderer.on(  `mentor:chunk:${id}`, onChunk);
    ipcRenderer.once(`mentor:done:${id}`,  onDone);

    // fire request
    ipcRenderer.send('mentor:ask', { id, payload });
  });
}

contextBridge.exposeInMainWorld('ai', { askMentor });