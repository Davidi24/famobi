type Props = { title: string; message: string; action?: { label: string; onClick: () => void } };

export const StatusMessage = ({ title, message, action }: Props) => (
  <div className="status" role="status">
    <h2>{title}</h2>
    <p>{message}</p>
    {action && (
      <button type="button" className="button" onClick={action.onClick}>
        {action.label}
      </button>
    )}
  </div>
);
