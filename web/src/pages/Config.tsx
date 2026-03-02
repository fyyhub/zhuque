import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Message,
  Space,
  Divider,
  Typography,
  Modal,
  Spin,
  Tabs,
  Grid,
} from '@arco-design/web-react';
import { IconSave, IconDownload, IconUpload } from '@arco-design/web-react/icon';
import axios from 'axios';

const FormItem = Form.Item;
const { Title, Text } = Typography;
const TabPane = Tabs.TabPane;
const { Row, Col } = Grid;

interface DiskInfo {
  name: string;
  mount_point: string;
  total_space: number;
  available_space: number;
  used_space: number;
  usage_percent: number;
}

interface SystemInfo {
  cpu_usage: number;
  memory_total: number;
  memory_used: number;
  memory_available: number;
  memory_usage_percent: number;
  disks: DiskInfo[];
  start_time: number;
  uptime_seconds: number;
}

const Config: React.FC = () => {
  const [form] = Form.useForm();
  const [saveLoading, setSaveLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [logRetentionDays, setLogRetentionDays] = useState(30);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('mirror');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [systemInfoLoading, setSystemInfoLoading] = useState(false);
  const [currentUptime, setCurrentUptime] = useState<number>(0);

  useEffect(() => {
    loadConfig();
    loadLogRetentionConfig();
    if (activeTab === 'system') {
      loadSystemInfo();
    }
  }, [activeTab]);

  useEffect(() => {
    if (systemInfo && activeTab === 'system') {
      // 初始化当前运行时间
      setCurrentUptime(systemInfo.uptime_seconds);

      // 每秒更新运行时间
      const timer = setInterval(() => {
        setCurrentUptime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [systemInfo, activeTab]);

  const loadConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/configs/mirror/config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      form.setFieldsValue(res.data);
    } catch (error: any) {
      Message.error('加载配置失败');
    }
  };

  const loadLogRetentionConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/configs/log_retention_days', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && res.data.value) {
        setLogRetentionDays(parseInt(res.data.value));
      }
    } catch (error) {
      // 如果配置不存在，使用默认值30天
      setLogRetentionDays(30);
    }
  };

  const loadSystemInfo = async () => {
    setSystemInfoLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/system/info', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSystemInfo(res.data);
    } catch (error: any) {
      Message.error('加载系统信息失败');
    } finally {
      setSystemInfoLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}天`);
    if (hours > 0) parts.push(`${hours}小时`);
    if (minutes > 0) parts.push(`${minutes}分钟`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`);

    return parts.join(' ');
  };

  const formatDateTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const handleSaveLogRetention = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/configs/log_retention_days', {
        value: logRetentionDays.toString(),
        description: '日志保留天数',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Message.success('保存成功');
    } catch (error: any) {
      Message.error(error.response?.data?.error || '保存失败');
    }
  };

  const handleCleanupLogs = async () => {
    Modal.confirm({
      title: '确认清理日志',
      content: `将删除 ${logRetentionDays} 天前的所有日志，此操作不可逆。确定要继续吗？`,
      onOk: async () => {
        try {
          setCleanupLoading(true);
          const token = localStorage.getItem('token');
          const res = await axios.delete(`/api/logs/cleanup/${logRetentionDays}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          Message.success(`成功清理 ${res.data.deleted} 条日志`);
        } catch (error: any) {
          Message.error(error.response?.data?.error || '清理失败');
        } finally {
          setCleanupLoading(false);
        }
      },
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validate();
      setSaveLoading(true);

      const token = localStorage.getItem('token');
      await axios.post('/api/configs/mirror/config', values, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Message.success('保存成功');
    } catch (error: any) {
      Message.error(error.response?.data?.error || '保存失败');
    } finally {
      setSaveLoading(false);
    }
  };

  const setDefaultMirrors = () => {
    form.setFieldsValue({
      npm_registry: 'https://registry.npmmirror.com',
      pip_index: 'https://pypi.tuna.tsinghua.edu.cn/simple',
      apt_source: 'https://mirrors.tuna.tsinghua.edu.cn/ubuntu/',
    });
  };

  const handleBackup = async () => {
    try {
      setBackupLoading(true);
      setGlobalLoading(true);
      setLoadingText('正在创建备份，请稍候...');

      const token = localStorage.getItem('token');

      const response = await axios.get('/api/backup', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // 从响应头获取文件名
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `xuanwu_backup_${new Date().getTime()}.tar.gz`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      Message.success('备份下载成功');
    } catch (error: any) {
      Message.error('备份失败');
    } finally {
      setBackupLoading(false);
      setGlobalLoading(false);
      setLoadingText('');
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Modal.confirm({
      title: '确认恢复备份',
      content: '恢复备份将覆盖当前所有数据，此操作不可逆。确定要继续吗？',
      onOk: async () => {
        try {
          setRestoreLoading(true);
          setGlobalLoading(true);
          setLoadingText('正在恢复备份，请稍候...');

          const token = localStorage.getItem('token');

          const formData = new FormData();
          formData.append('file', file);

          const response = await axios.post('/api/backup/restore', formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          });

          Message.success(response.data.message || '恢复成功');
        } catch (error: any) {
          Message.error(error.response?.data?.message || '恢复失败');
        } finally {
          setRestoreLoading(false);
          setGlobalLoading(false);
          setLoadingText('');
          // 清空 input，允许重复选择同一个文件
          e.target.value = '';
        }
      },
      onCancel: () => {
        // 取消时也清空 input
        e.target.value = '';
      },
    });
  };

  return (
    <Spin
      loading={globalLoading}
      tip={loadingText}
      style={{
        display: 'block',
        minHeight: '100vh'
      }}
    >
      <div style={{
        pointerEvents: globalLoading ? 'none' : 'auto',
        opacity: globalLoading ? 0.6 : 1,
        transition: 'opacity 0.3s'
      }}>
      <Card title="系统配置">
        <Tabs activeTab={activeTab} onChange={setActiveTab} type="card">
          <TabPane key="mirror" title="镜像源配置">
            <div style={{ padding: '16px 24px' }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Space>
                  <Button onClick={setDefaultMirrors}>
                    使用默认镜像
                  </Button>
                  <Button
                    type="primary"
                    icon={<IconSave />}
                    loading={saveLoading}
                    onClick={handleSave}
                  >
                    保存配置
                  </Button>
                </Space>
              </div>

              <Form form={form} layout="vertical">
                <Title heading={6}>Node.js 镜像源</Title>
                <FormItem
                  label="NPM Registry"
                  field="npm_registry"
                  extra="用于 npm 包安装，留空使用官方源"
                >
                  <Input placeholder="https://registry.npmmirror.com" />
                </FormItem>

                <Divider />

                <Title heading={6}>Python 镜像源</Title>
                <FormItem
                  label="Pip Index"
                  field="pip_index"
                  extra="用于 Python 包安装，留空使用官方源"
                >
                  <Input placeholder="https://pypi.tuna.tsinghua.edu.cn/simple" />
                </FormItem>

                <Divider />

                <Title heading={6}>Linux 镜像源</Title>
                <FormItem
                  label="APT Source"
                  field="apt_source"
                  extra="用于 Linux 包安装，留空使用官方源"
                >
                  <Input placeholder="https://mirrors.tuna.tsinghua.edu.cn/ubuntu/" />
                </FormItem>
              </Form>

              <Divider />

              <div style={{ marginTop: 24 }}>
                <Title heading={6}>常用镜像源</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text bold>NPM:</Text>
                    <ul style={{ marginTop: 8 }}>
                      <li>淘宝镜像: https://registry.npmmirror.com</li>
                      <li>腾讯镜像: https://mirrors.cloud.tencent.com/npm/</li>
                      <li>华为镜像: https://mirrors.huaweicloud.com/repository/npm/</li>
                    </ul>
                  </div>
                  <div>
                    <Text bold>Pip:</Text>
                    <ul style={{ marginTop: 8 }}>
                      <li>清华镜像: https://pypi.tuna.tsinghua.edu.cn/simple</li>
                      <li>阿里镜像: https://mirrors.aliyun.com/pypi/simple/</li>
                      <li>豆瓣镜像: https://pypi.douban.com/simple/</li>
                    </ul>
                  </div>
                  <div>
                    <Text bold>APT:</Text>
                    <ul style={{ marginTop: 8 }}>
                      <li>清华镜像: https://mirrors.tuna.tsinghua.edu.cn/ubuntu/</li>
                      <li>阿里镜像: https://mirrors.aliyun.com/ubuntu/</li>
                      <li>网易镜像: https://mirrors.163.com/ubuntu/</li>
                    </ul>
                  </div>
                </Space>
              </div>
            </div>
          </TabPane>

          <TabPane key="backup" title="备份与恢复">
            <div style={{ padding: '16px 24px' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <Typography.Title heading={6}>数据备份</Typography.Title>
                  <Typography.Text type="secondary">
                    备份包含所有任务、脚本、依赖、配置和日志数据
                  </Typography.Text>
                  <div style={{ marginTop: 12 }}>
                    <Button
                      type="primary"
                      icon={<IconDownload />}
                      loading={backupLoading}
                      onClick={handleBackup}
                    >
                      创建备份
                    </Button>
                  </div>
                </div>

                <Divider />

                <div>
                  <Typography.Title heading={6}>数据恢复</Typography.Title>
                  <Typography.Text type="secondary">
                    从备份文件恢复数据，将覆盖当前所有数据
                  </Typography.Text>
                  <div style={{ marginTop: 12 }}>
                    <input
                      type="file"
                      accept=".tar.gz,.tgz"
                      onChange={handleRestoreFile}
                      style={{ display: 'none' }}
                      id="restore-file-input"
                    />
                    <label htmlFor="restore-file-input">
                      <Button
                        type="outline"
                        icon={<IconUpload />}
                        loading={restoreLoading}
                        status="warning"
                        onClick={() => document.getElementById('restore-file-input')?.click()}
                      >
                        恢复备份
                      </Button>
                    </label>
                  </div>
                </div>
              </Space>
            </div>
          </TabPane>

          <TabPane key="logs" title="日志管理">
            <div style={{ padding: '16px 24px' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <Typography.Title heading={6}>日志保留设置</Typography.Title>
                  <Typography.Text type="secondary">
                    系统会每天自动清理超过保留天数的日志
                  </Typography.Text>
                  <div style={{ marginTop: 12 }}>
                    <Space>
                      <Input
                        type="number"
                        value={logRetentionDays.toString()}
                        onChange={(value) => setLogRetentionDays(parseInt(value) || 30)}
                        style={{ width: 120 }}
                        suffix="天"
                        min={1}
                        max={365}
                      />
                      <Button type="primary" onClick={handleSaveLogRetention}>
                        保存设置
                      </Button>
                    </Space>
                  </div>
                </div>

                <Divider />

                <div>
                  <Typography.Title heading={6}>手动清理日志</Typography.Title>
                  <Typography.Text type="secondary">
                    立即清理超过保留天数的日志
                  </Typography.Text>
                  <div style={{ marginTop: 12 }}>
                    <Button
                      type="outline"
                      status="warning"
                      loading={cleanupLoading}
                      onClick={handleCleanupLogs}
                    >
                      清理旧日志
                    </Button>
                  </div>
                </div>
              </Space>
            </div>
          </TabPane>

          <TabPane key="system" title="系统信息">
            <div style={{ padding: '16px 24px' }}>
              <Spin loading={systemInfoLoading}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <div>
                    <Typography.Title heading={6}>基本信息</Typography.Title>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={12} lg={8} xl={6}>
                        <div>
                          <Text bold>版本:</Text> <Text>朱雀 v1.0.0</Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={12} lg={8} xl={6}>
                        <div>
                          <Text bold>更新时间:</Text> <Text>2026/03/01</Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={12} lg={8} xl={6}>
                        <div>
                          <Text bold>后端:</Text> <Text>Rust + Axum</Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={12} lg={8} xl={6}>
                        <div>
                          <Text bold>前端:</Text> <Text>React 18 + TypeScript + Arco Design</Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={12} lg={8} xl={6}>
                        <div>
                          <Text bold>数据库:</Text> <Text>SQLite</Text>
                        </div>
                      </Col>
                      {systemInfo && (
                        <>
                          <Col xs={24} sm={12} md={12} lg={8} xl={6}>
                            <div>
                              <Text bold>启动时间:</Text> <Text>{formatDateTime(systemInfo.start_time)}</Text>
                            </div>
                          </Col>
                          <Col xs={24} sm={12} md={12} lg={8} xl={6}>
                            <div>
                              <Text bold>已运行:</Text> <Text>{formatUptime(currentUptime)}</Text>
                            </div>
                          </Col>
                        </>
                      )}
                    </Row>
                  </div>

                  {systemInfo && (
                    <>
                      <Divider />

                      <div>
                        <Typography.Title heading={6}>系统资源</Typography.Title>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12} md={12} lg={8} xl={8}>
                            <Card title="CPU" size="small">
                              <Space direction="vertical" style={{ width: '100%' }}>
                                <div>
                                  <Text bold>使用率:</Text> <Text>{systemInfo.cpu_usage.toFixed(2)}%</Text>
                                </div>
                              </Space>
                            </Card>
                          </Col>
                          <Col xs={24} sm={12} md={12} lg={8} xl={8}>
                            <Card title="内存" size="small">
                              <Space direction="vertical" style={{ width: '100%' }}>
                                <div>
                                  <Text bold>总容量:</Text> <Text>{formatBytes(systemInfo.memory_total)}</Text>
                                </div>
                                <div>
                                  <Text bold>已使用:</Text> <Text>{formatBytes(systemInfo.memory_used)}</Text>
                                </div>
                                <div>
                                  <Text bold>可用:</Text> <Text>{formatBytes(systemInfo.memory_available)}</Text>
                                </div>
                                <div>
                                  <Text bold>使用率:</Text> <Text>{systemInfo.memory_usage_percent.toFixed(2)}%</Text>
                                </div>
                              </Space>
                            </Card>
                          </Col>
                        </Row>
                      </div>

                      <Divider />

                      <div>
                        <Typography.Title heading={6}>磁盘</Typography.Title>
                        <Row gutter={[16, 16]}>
                          {systemInfo.disks.map((disk, index) => (
                            <Col key={index} xs={24} sm={12} md={12} lg={8} xl={8}>
                              <Card title={disk.mount_point} size="small">
                                <Space direction="vertical" style={{ width: '100%' }}>
                                  <div>
                                    <Text bold>总容量:</Text> <Text>{formatBytes(disk.total_space)}</Text>
                                  </div>
                                  <div>
                                    <Text bold>已使用:</Text> <Text>{formatBytes(disk.used_space)}</Text>
                                  </div>
                                  <div>
                                    <Text bold>可用:</Text> <Text>{formatBytes(disk.available_space)}</Text>
                                  </div>
                                  <div>
                                    <Text bold>使用率:</Text> <Text>{disk.usage_percent.toFixed(2)}%</Text>
                                  </div>
                                </Space>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </>
                  )}
                </Space>
              </Spin>
            </div>
          </TabPane>
        </Tabs>
      </Card>
      </div>
    </Spin>
  );
};

export default Config;
