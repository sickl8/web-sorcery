export default function slash(path: string) {
	return typeof path === 'string' ? path.replace(/\\/g, '/') : path;
}
