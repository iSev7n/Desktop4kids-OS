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
