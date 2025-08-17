import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, LogIn } from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export default function AdminLoginPage() {

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: 'longxianmian@gmail.com',
    password: 'Wjbb5260',
  });
  const { isAuthenticated, login } = useAdminAuth();

  // 如果已经登录，重定向到后台
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/admin/activities');
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    const result = await login(formData.username, formData.password);


    if (result.success) {
      toast({
        title: '登录成功',
        description: '正在跳转到管理后台...',
      });
      setTimeout(() => {
        setLocation('/admin/activities');
      }, 1000);
    } else {
      toast({
        title: '登录失败',
        description: result.message || '用户名或密码错误',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  // 如果已经认证，显示跳转提示
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在跳转到管理后台...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">后台管理登录</CardTitle>
          <CardDescription>
            请使用管理员账号进行登录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名 (邮箱)</Label>
              <Input
                id="username"
                type="email"
                placeholder="请输入管理员邮箱"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入管理员密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>正在登录...</>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  登录
                </>
              )}
            </Button>
          </form>
          

        </CardContent>
      </Card>
    </div>
  );
}