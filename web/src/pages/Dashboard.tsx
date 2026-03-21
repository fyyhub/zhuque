import React, { useEffect, useState } from 'react';
import { Grid, Card, Statistic, Table, Space, Tag, Button, Progress, Modal } from '@arco-design/web-react';
import { IconClockCircle, IconCheckCircle, IconCloseCircle, IconFile, IconGithub } from '@arco-design/web-react/icon';
import { taskApi } from '@/api/task';
import { logApi } from '@/api/log';
import axios from 'axios';
import type { Log } from '@/types';
import './Dashboard.css';

const { Row, Col } = Grid;

interface SystemInfo {
  cpu_usage: number;
  memory_total: number;
  memory_used: number;
  memory_available: number;
  memory_usage_percent: number;
}

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Array<{ id: number; name: string; enabled: boolean }>>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [logVisible, setLogVisible] = useState(false);
  const [logContent, setLogContent] = useState('');
  const [logLoading, setLogLoading] = useState(false);

  useEffect(() => {
    loadData();
    loadSystemInfo();
    const interval = setInterval(loadSystemInfo, 5000); // 每5秒更新一次
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, logsRes]: any = await Promise.all([
        taskApi.listSimple(),
        logApi.list(undefined, 1, 10),
      ]);
      setTasks(tasksRes);
      setLogs(logsRes.data);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/system/info', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSystemInfo(res.data);
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleViewLog = async (log: Log) => {
    setLogVisible(true);
    setLogContent('');
    setLogLoading(true);

    try {
      const logDetail = await logApi.get(log.id);
      const startTime = new Date(logDetail.created_at).toLocaleString('zh-CN');
      setLogContent(`[任务开始时间: ${startTime}]\n${logDetail.output || '无日志输出'}`);
    } catch (error) {
      console.error('Failed to load log detail:', error);
      setLogContent('加载日志失败');
    } finally {
      setLogLoading(false);
    }
  };

  const stats = {
    total: tasks.length,
    enabled: tasks.filter(t => t.enabled).length,
    disabled: tasks.filter(t => !t.enabled).length,
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'task_id',
      width: 150,
      ellipsis: true,
      render: (_: any, record: Log) => {
        const task = tasks.find((t) => t.id === record.task_id);
        return task?.name || '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status === 'success' ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '执行时间',
      dataIndex: 'created_at',
      width: 160,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      width: 120,
      render: (duration: number | undefined) => {
        if (!duration) return '-';
        return `${duration}ms (${(duration / 1000).toFixed(2)}s)`;
      },
    },
    {
      title: '操作',
      width: 100,
      render: (_: any, record: Log) => (
        <Button
          type="text"
          size="small"
          icon={<IconFile />}
          onClick={() => handleViewLog(record)}
        >
          日志
        </Button>
      ),
    },
  ];

  return (
    <div className="dashboard">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={stats.total}
              prefix={<IconClockCircle />}
              styleValue={{ color: '#165DFF' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Card>
            <Statistic
              title="已启用"
              value={stats.enabled}
              prefix={<IconCheckCircle />}
              styleValue={{ color: '#00B42A' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Card>
            <Statistic
              title="已禁用"
              value={stats.disabled}
              prefix={<IconCloseCircle />}
              styleValue={{ color: '#F53F3F' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Card>
            <Statistic
              title="CPU使用率"
              value={systemInfo ? systemInfo.cpu_usage.toFixed(1) : '-'}
              suffix="%"
              styleValue={{ color: systemInfo && systemInfo.cpu_usage > 80 ? '#F53F3F' : '#165DFF' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          <Card title="内存使用情况">
            {systemInfo && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <span>已使用: {formatBytes(systemInfo.memory_used)} / {formatBytes(systemInfo.memory_total)}</span>
                    <span style={{ float: 'right' }}>{systemInfo.memory_usage_percent.toFixed(1)}%</span>
                  </div>
                  <Progress
                    percent={systemInfo.memory_usage_percent}
                    status={systemInfo.memory_usage_percent > 80 ? 'error' : 'normal'}
                  />
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-3)' }}>
                  可用: {formatBytes(systemInfo.memory_available)}
                </div>
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={24} md={24} lg={12} xl={12}>
          <Card title="CPU使用情况">
            {systemInfo && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <span>CPU使用率</span>
                    <span style={{ float: 'right' }}>{systemInfo.cpu_usage.toFixed(1)}%</span>
                  </div>
                  <Progress
                    percent={systemInfo.cpu_usage}
                    status={systemInfo.cpu_usage > 80 ? 'error' : 'normal'}
                  />
                </div>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title="最近执行日志"
        style={{ marginTop: 16 }}
        extra={
          <Button type="text" onClick={loadData}>
            刷新
          </Button>
        }
      >
        <Table
          columns={columns}
          data={logs}
          loading={loading}
          pagination={false}
          scroll={{ x: true }}
        />
      </Card>

      <Modal
        title="日志详情"
        visible={logVisible}
        onCancel={() => setLogVisible(false)}
        footer={null}
        style={{ width: '80%', maxWidth: 1000 }}
      >
        {logLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
        ) : (
          <pre style={{
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: '16px',
            borderRadius: '4px',
            maxHeight: '600px',
            overflow: 'auto',
            fontSize: '13px',
            lineHeight: '1.5',
            margin: 0,
          }}>
            {logContent}
          </pre>
        )}
      </Modal>

      <div className="dashboard-footer">
        <a
          href="https://github.com/mtvpls/zhuque"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconGithub style={{ marginRight: '8px' }} />
          GitHub
        </a>
      </div>
    </div>
  );
};

export default Dashboard;
