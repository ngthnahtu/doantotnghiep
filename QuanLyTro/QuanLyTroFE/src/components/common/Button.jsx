function Button({
    children,
    type="button",
    onClick,
    className="",
    disabled=false
}) {
    return(
        <button type={type} onClick={onClick} disabled={disabled}
        className={`rounded-2xl px-2 py-1 bg-blue-500 text-white hover:bg-blue-700 transition-colors duration-200 ${className}`} 
        >
            {children}
        </button>
    );
}
export default Button;