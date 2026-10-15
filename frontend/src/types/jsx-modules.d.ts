declare module '*.jsx' {
  const Component: any;
  export default Component;
  export const Dashboard: any;
  export const MemberDashboard: any;
  export const Sidebar: any;
}
declare module './Dashboard' {
  export const Dashboard: any;
  export default Dashboard;
}
declare module './MemberDashboard' {
  export const MemberDashboard: any;
  export default MemberDashboard;
}
