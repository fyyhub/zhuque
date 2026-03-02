import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Message,
  Upload,
  Breadcrumb,
  Dropdown,
  Menu,
  Spin,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconDownload,
  IconUpload,
  IconFolder,
  IconFile,
  IconFolderAdd,
  IconMore,
  IconPlayArrow,
  IconSave,
  IconRefresh,
  IconMenuFold,
  IconMenuUnfold,
} from '@arco-design/web-react/icon';
import axios from 'axios';

interface ScriptFile {
  name: string;
  path: string;
  size: number;
  modified: string;
  is_directory: boolean;
  isDirectory?: boolean;
}

const Scripts: React.FC = () => {
  const [files, setFiles] = useState<ScriptFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<ScriptFile | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [isDebugRunning, setIsDebugRunning] = useState(false);
  const [createFileVisible, setCreateFileVisible] = useState(false);
  const [createFolderVisible, setCreateFolderVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renamingFile, setRenamingFile] = useState<ScriptFile | null>(null);
  const [logVisible, setLogVisible] = useState(false);
  const [logContent, setLogContent] = useState('');
  const [logLoading, setLogLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [form] = Form.useForm();
  const [folderForm] = Form.useForm();
  const [renameForm] = Form.useForm();

  useEffect(() => {
    loadFiles();
    loadTree();
  }, [currentPath]);

  const loadTree = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.get('/api/scripts', {
        headers: { Authorization: `Bearer ${token}` },
        params: { path: '' },
      });
    } catch (error) {
      console.error('加载目录树失败', error);
    }
  };

  const loadFiles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/scripts', {
        headers: { Authorization: `Bearer ${token}` },
        params: { path: currentPath },
      });

      // 后端已经返回当前目录的直接子项，过滤掉隐藏文件（以.开头的文件/文件夹）
      const items: ScriptFile[] = res.data
        .filter((file: any) => !file.name.startsWith('.'))
        .map((file: any) => ({
          ...file,
          isDirectory: file.is_directory,
        }));

      setFiles(items);
    } catch (error: any) {
      Message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleOpenFolder = (folder: ScriptFile) => {
    setCurrentPath(folder.path);
  };

  const handleCreateFile = async () => {
    try {
      const values = await form.validate();
      const token = localStorage.getItem('token');
      const filePath = currentPath ? `${currentPath}/${values.name}` : values.name;

      await axios.put(`/api/scripts/${filePath}`, values.content || '', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
      });

      Message.success('创建成功');
      setCreateFileVisible(false);
      form.resetFields();
      loadFiles();
    } catch (error: any) {
      Message.error('创建失败');
    }
  };

  const handleCreateFolder = async () => {
    try {
      const values = await folderForm.validate();
      const token = localStorage.getItem('token');
      const folderPath = currentPath ? `${currentPath}/${values.name}` : values.name;

      await axios.post(`/api/scripts/directories/${folderPath}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Message.success('创建成功');
      setCreateFolderVisible(false);
      folderForm.resetFields();
      loadFiles();
    } catch (error: any) {
      Message.error('创建失败');
    }
  };

  const handleEdit = async (file: ScriptFile) => {
    if (file.isDirectory) {
      handleOpenFolder(file);
      return;
    }

    if (hasUnsavedChanges) {
      Modal.confirm({
        title: '有未保存的更改',
        content: '是否放弃当前更改并打开新文件？',
        onOk: () => loadFileContent(file),
      });
    } else {
      loadFileContent(file);
    }
  };

  const loadFileContent = async (file: ScriptFile) => {
    setSelectedFile(file);
    setContentLoading(true);
    setFileContent('');
    setHasUnsavedChanges(false);
    setIsEditing(false);
    setIsDebugging(false);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/scripts/${file.path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFileContent(res.data);
    } catch (error: any) {
      Message.error('读取文件失败');
    } finally {
      setContentLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/scripts/${selectedFile.path}`, fileContent, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
      });
      Message.success('保存成功');
      setHasUnsavedChanges(false);
      loadFiles();
    } catch (error: any) {
      Message.error('保存失败');
    }
  };

  const handleDelete = async (file: ScriptFile) => {
    try {
      const token = localStorage.getItem('token');
      if (file.isDirectory) {
        await axios.delete(`/api/scripts/directories/${file.path}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.delete(`/api/scripts/${file.path}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      Message.success('删除成功');
      loadFiles();
    } catch (error: any) {
      Message.error('删除失败');
    }
  };

  const handleRename = (file: ScriptFile) => {
    setRenamingFile(file);
    renameForm.setFieldValue('newName', file.name);
    setRenameVisible(true);
  };

  const handleRenameSubmit = async () => {
    if (!renamingFile) return;

    try {
      const values = await renameForm.validate();
      const token = localStorage.getItem('token');

      // 计算新路径
      const pathParts = renamingFile.path.split('/');
      pathParts[pathParts.length - 1] = values.newName;
      const newPath = pathParts.join('/');

      await axios.post(
        `/api/scripts/rename/${renamingFile.path}`,
        { new_path: newPath },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      Message.success('重命名成功');
      setRenameVisible(false);
      renameForm.resetFields();
      setRenamingFile(null);

      // 如果重命名的是当前打开的文件，清除选择
      if (selectedFile?.path === renamingFile.path) {
        setSelectedFile(null);
        setFileContent('');
        setHasUnsavedChanges(false);
      }

      loadFiles();
      loadTree();
    } catch (error: any) {
      Message.error('重命名失败');
    }
  };

  const handleDownload = async (file: ScriptFile) => {
    if (file.isDirectory) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/scripts/${file.path}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      Message.error('下载失败');
    }
  };

  const handleRun = async (file: ScriptFile) => {
    if (file.isDirectory) return;

    setLogVisible(true);
    setLogLoading(true);
    setLogContent('[正在执行脚本...]\n');

    try {
      const token = localStorage.getItem('token');
      const url = `/api/scripts/execute/${file.path}${token ? `?token=${token}` : ''}`;

      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setLogLoading(false);
        setLogContent('[脚本开始执行]\n');
      };

      eventSource.onmessage = (event) => {
        setLogLoading(false);
        setLogContent(prev => prev + event.data + '\n');
      };

      eventSource.onerror = () => {
        eventSource.close();
        setLogLoading(false);
        setLogContent(prev => prev + '\n[脚本执行结束]');
      };
    } catch (error: any) {
      setLogLoading(false);
      setLogContent('执行失败');
      Message.error('执行失败');
    }
  };

  const handleDebug = () => {
    if (!selectedFile) return;
    setIsDebugging(true);
    setIsEditing(false);
  };

  const handleDebugRun = async () => {
    if (!selectedFile || isDebugRunning) return;

    // 不弹出日志窗口，直接在右侧显示
    setIsDebugRunning(true);
    setLogLoading(true);
    setLogContent('[正在调试脚本...]\n');

    try {
      const token = localStorage.getItem('token');

      // 获取脚本类型
      let scriptType = 'sh';
      if (selectedFile.name.endsWith('.py')) {
        scriptType = 'py';
      } else if (selectedFile.name.endsWith('.js')) {
        scriptType = 'js';
      }

      const response = await fetch('/api/scripts/debug', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: fileContent,
          script_type: scriptType,
          file_path: selectedFile.path, // 传递当前文件路径
        }),
      });

      if (!response.ok) {
        throw new Error('调试请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      setLogLoading(false);
      setLogContent('[脚本开始执行]\n');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data) {
              setLogContent(prev => prev + data + '\n');
            }
          }
        }
      }

      setLogContent(prev => prev + '\n[脚本执行结束]');
    } catch (error: any) {
      setLogLoading(false);
      setLogContent(prev => prev + '\n[执行失败: ' + error.message + ']');
      Message.error('调试失败');
    } finally {
      setIsDebugRunning(false);
    }
  };

  const getBreadcrumbs = () => {
    if (!currentPath) return [{ name: '根目录', path: '' }];

    const parts = currentPath.split('/');
    const breadcrumbs = [{ name: '根目录', path: '' }];

    let path = '';
    parts.forEach((part) => {
      path = path ? `${path}/${part}` : part;
      breadcrumbs.push({ name: part, path });
    });

    return breadcrumbs;
  };

  const isExecutable = (fileName: string): boolean => {
    return fileName.endsWith('.sh') || fileName.endsWith('.py') || fileName.endsWith('.js');
  };

  const renderFileList = () => {
    return (
      <div style={{ padding: '12px' }}>
        {files.map((file) => {
          const isActive = selectedFile?.path === file.path;
          return (
            <div
              key={file.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: isActive ? '#e8f3ff' : 'transparent',
                borderRadius: '4px',
                marginBottom: '4px',
              }}
              onClick={() => file.isDirectory ? handleOpenFolder(file) : handleEdit(file)}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
            >
              <Space>
                {file.isDirectory ? (
                  <IconFolder style={{ fontSize: 16, color: '#f7ba1e' }} />
                ) : (
                  <IconFile style={{ fontSize: 16, color: '#165dff' }} />
                )}
                <span style={{ fontSize: '14px' }}>{file.name}</span>
              </Space>
              <div style={{ marginLeft: 'auto' }}>
                <Dropdown
                  droplist={
                    <Menu>
                      {!file.isDirectory && isExecutable(file.name) && (
                        <Menu.Item key="run" onClick={() => handleRun(file)}>
                          <Space>
                            <IconPlayArrow />
                            运行
                          </Space>
                        </Menu.Item>
                      )}
                      {!file.isDirectory && (
                        <Menu.Item key="download" onClick={() => handleDownload(file)}>
                          <Space>
                            <IconDownload />
                            下载
                          </Space>
                        </Menu.Item>
                      )}
                      <Menu.Item key="rename" onClick={() => handleRename(file)}>
                        <Space>
                          <IconEdit />
                          重命名
                        </Space>
                      </Menu.Item>
                      <Menu.Item
                        key="delete"
                        onClick={() => {
                          Modal.confirm({
                            title: `确定删除${file.isDirectory ? '文件夹' : '文件'}吗？`,
                            content: file.isDirectory ? '删除文件夹将删除其中所有内容' : '',
                            onOk: () => handleDelete(file),
                          });
                        }}
                      >
                        <Space>
                          <IconDelete />
                          删除
                        </Space>
                      </Menu.Item>
                    </Menu>
                  }
                  position="br"
                  trigger="click"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<IconMore />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: '16px' }}>
      {/* 左侧文件列表 */}
      {!sidebarCollapsed && (
        <Card
          style={{ width: '300px', display: 'flex', flexDirection: 'column' }}
          bodyStyle={{ flex: 1, overflow: 'auto', padding: 0 }}
          title={
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
              脚本文件
            </div>
          }
          extra={
            <Space>
              <Button
                type="text"
                size="small"
                icon={<IconRefresh />}
                onClick={() => {
                  loadFiles();
                  loadTree();
                }}
              />
              <Button
                type="text"
                size="small"
                icon={<IconMenuFold />}
                onClick={() => setSidebarCollapsed(true)}
              />
            </Space>
          }
        >
        <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
          <Breadcrumb>
            {getBreadcrumbs().map((item) => (
              <Breadcrumb.Item
                key={item.path}
                style={{ cursor: 'pointer' }}
                onClick={() => handleNavigate(item.path)}
              >
                {item.name}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>

        <div style={{ padding: '8px', borderBottom: '1px solid var(--color-border)' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Space style={{ width: '100%' }} size="small">
              <Button
                type="text"
                size="mini"
                icon={<IconPlus />}
                onClick={() => setCreateFileVisible(true)}
                style={{ flex: 1 }}
              >
                新建文件
              </Button>
              <Button
                type="text"
                size="mini"
                icon={<IconFolderAdd />}
                onClick={() => setCreateFolderVisible(true)}
                style={{ flex: 1 }}
              >
                新建文件夹
              </Button>
            </Space>
            <Space style={{ width: '100%' }} size="small">
              <Upload
                action="/api/scripts"
                headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                data={{ path: currentPath }}
                onChange={(_, file) => {
                  if (file.status === 'done') {
                    Message.success('上传成功');
                    loadFiles();
                  } else if (file.status === 'error') {
                    Message.error('上传失败');
                  }
                }}
                showUploadList={false}
              >
                <Button type="outline" size="mini" icon={<IconUpload />} style={{ width: '100%' }}>
                  上传文件
                </Button>
              </Upload>
              <Upload
                action="/api/scripts/archive"
                headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                data={{ path: currentPath }}
                accept=".zip,.tar,.tar.gz,.tgz"
                onChange={(_, file) => {
                  if (file.status === 'done') {
                    Message.success('压缩包上传并解压成功');
                    loadFiles();
                    loadTree();
                  } else if (file.status === 'error') {
                    Message.error('压缩包上传失败');
                  }
                }}
                showUploadList={false}
              >
                <Button type="primary" size="mini" icon={<IconUpload />} style={{ width: '100%' }}>
                  上传压缩包
                </Button>
              </Upload>
            </Space>
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin />
          </div>
        ) : (
          renderFileList()
        )}
      </Card>
      )}

      {/* 右侧编辑器 */}
      <Card
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, overflow: 'hidden', padding: 0 }}
        title={
          <Space>
            {sidebarCollapsed && (
              <Button
                type="text"
                size="small"
                icon={<IconMenuUnfold />}
                onClick={() => setSidebarCollapsed(false)}
              />
            )}
            {selectedFile ? (
              <>
                <IconFile style={{ fontSize: 16, color: '#165dff' }} />
                <span style={{ fontSize: '14px' }}>{selectedFile.name}</span>
                {hasUnsavedChanges && <span style={{ color: '#f53f3f' }}>●</span>}
              </>
            ) : (
              <span style={{ fontSize: '14px', color: '#86909c' }}>未选择文件</span>
            )}
          </Space>
        }
        extra={
          selectedFile && (
            <Space>
              {!isEditing && !isDebugging && (
                <>
                  <Button
                    type="outline"
                    size="small"
                    icon={<IconEdit />}
                    onClick={() => setIsEditing(true)}
                  >
                    编辑
                  </Button>
                  {isExecutable(selectedFile.name) && (
                    <>
                      <Button
                        type="outline"
                        size="small"
                        icon={<IconPlayArrow />}
                        onClick={() => handleRun(selectedFile)}
                      >
                        运行
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        onClick={handleDebug}
                      >
                        调试
                      </Button>
                    </>
                  )}
                </>
              )}
              {isEditing && (
                <>
                  <Button
                    type="outline"
                    size="small"
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        Modal.confirm({
                          title: '有未保存的更改',
                          content: '是否放弃更改？',
                          onOk: () => {
                            loadFileContent(selectedFile);
                            setIsEditing(false);
                          },
                        });
                      } else {
                        setIsEditing(false);
                      }
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    icon={<IconSave />}
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges}
                  >
                    保存
                  </Button>
                </>
              )}
              {isDebugging && (
                <>
                  <Button
                    type="outline"
                    size="small"
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        Modal.confirm({
                          title: '有未保存的更改',
                          content: '是否放弃更改？',
                          onOk: () => {
                            loadFileContent(selectedFile);
                            setIsDebugging(false);
                          },
                        });
                      } else {
                        setIsDebugging(false);
                      }
                    }}
                  >
                    退出调试
                  </Button>
                  <Button
                    type="outline"
                    size="small"
                    icon={<IconSave />}
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || isDebugRunning}
                  >
                    保存
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    icon={<IconPlayArrow />}
                    onClick={handleDebugRun}
                    disabled={isDebugRunning}
                    loading={isDebugRunning}
                  >
                    {isDebugRunning ? '运行中...' : '运行调试'}
                  </Button>
                </>
              )}
            </Space>
          )
        }
      >
        {contentLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Spin />
          </div>
        ) : selectedFile ? (
          isDebugging ? (
            // 调试模式：左右分屏
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{ flex: 1, borderRight: '1px solid var(--color-border)' }}>
                <Input.TextArea
                  value={fileContent}
                  onChange={(value) => {
                    setFileContent(value);
                    setHasUnsavedChanges(true);
                  }}
                  style={{
                    height: '100%',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '14px',
                    border: 'none',
                    resize: 'none',
                  }}
                />
              </div>
              <div
                style={{
                  width: '40%',
                  backgroundColor: '#1e1e1e',
                  color: '#d4d4d4',
                  padding: '16px',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '13px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {logLoading ? '等待执行...' : logContent || '点击"运行调试"执行脚本'}
              </div>
            </div>
          ) : (
            // 查看/编辑模式
            <Input.TextArea
              value={fileContent}
              onChange={(value) => {
                if (isEditing) {
                  setFileContent(value);
                  setHasUnsavedChanges(true);
                }
              }}
              readOnly={!isEditing}
              style={{
                height: '100%',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '14px',
                border: 'none',
                resize: 'none',
                backgroundColor: isEditing ? 'transparent' : '#f7f8fa',
                cursor: isEditing ? 'text' : 'default',
              }}
            />
          )
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#86909c',
              fontSize: '14px',
            }}
          >
            选择一个文件开始编辑
          </div>
        )}
      </Card>

      {/* 新建文件 */}
      <Modal
        title="新建文件"
        visible={createFileVisible}
        onOk={handleCreateFile}
        onCancel={() => {
          setCreateFileVisible(false);
          form.resetFields();
        }}
        autoFocus={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="文件名"
            field="name"
            rules={[{ required: true, message: '请输入文件名' }]}
          >
            <Input placeholder="例如: test.py" />
          </Form.Item>
          <Form.Item label="文件内容" field="content">
            <Input.TextArea
              rows={10}
              placeholder="文件内容（可选）"
              style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新建文件夹 */}
      <Modal
        title="新建文件夹"
        visible={createFolderVisible}
        onOk={handleCreateFolder}
        onCancel={() => {
          setCreateFolderVisible(false);
          folderForm.resetFields();
        }}
        autoFocus={false}
      >
        <Form form={folderForm} layout="vertical">
          <Form.Item
            label="文件夹名"
            field="name"
            rules={[{ required: true, message: '请输入文件夹名' }]}
          >
            <Input placeholder="例如: utils" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 重命名 */}
      <Modal
        title={`重命名 - ${renamingFile?.name}`}
        visible={renameVisible}
        onOk={handleRenameSubmit}
        onCancel={() => {
          setRenameVisible(false);
          renameForm.resetFields();
          setRenamingFile(null);
        }}
        autoFocus={false}
      >
        <Form form={renameForm} layout="vertical">
          <Form.Item
            label="新名称"
            field="newName"
            rules={[{ required: true, message: '请输入新名称' }]}
          >
            <Input placeholder="请输入新名称" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 执行日志 */}
      <Modal
        title="执行日志"
        visible={logVisible}
        onCancel={() => setLogVisible(false)}
        footer={null}
        autoFocus={false}
        style={{ width: '90%', maxWidth: 1000 }}
      >
        <div
          style={{
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            padding: '16px',
            borderRadius: '4px',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '13px',
            maxHeight: '600px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {logLoading ? '加载中...' : logContent || '暂无日志'}
        </div>
      </Modal>
    </div>
  );
};

export default Scripts;
