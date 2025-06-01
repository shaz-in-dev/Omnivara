class Lead {
  const Lead({
    required this.id,
    required this.name,
    required this.status,
    this.email,
    this.company,
    this.source,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String status;
  final String? email;
  final String? company;
  final String? source;
  final DateTime createdAt;

  factory Lead.fromJson(Map<String, dynamic> json) => Lead(
        id:        json['id'] as String,
        name:      json['name'] as String,
        status:    json['status'] as String? ?? 'new',
        email:     json['email'] as String?,
        company:   json['company'] as String?,
        source:    json['source'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  static Color statusColor(String status) {
    switch (status) {
      case 'qualified':  return const Color(0xFF22C55E);
      case 'contacted':  return const Color(0xFF3B82F6);
      case 'converted':  return const Color(0xFF6366F1);
      case 'disqualified': return const Color(0xFFEF4444);
      default:           return const Color(0xFF94A3B8);
    }
  }
}
