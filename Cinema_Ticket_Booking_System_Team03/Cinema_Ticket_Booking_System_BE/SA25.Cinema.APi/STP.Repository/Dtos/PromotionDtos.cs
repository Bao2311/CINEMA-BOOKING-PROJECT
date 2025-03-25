namespace STP.Repository.Dtos
{
    public class PromotionCreateDto
    {
        public string Title { get; set; }
        public string Promotion_Code { get; set; }
        public DateTime Start_Date { get; set; }
        public DateTime End_Date { get; set; }
        public string Discount_Type { get; set; }
        public decimal Discount_Value { get; set; }
        public decimal Minimum_Purchase { get; set; } = 0;
        public decimal? Maximum_Discount { get; set; }
        public string Applicable_For { get; set; } = "All";
        public int? Usage_Limit { get; set; }
        public string Status { get; set; }
        public string Promotion_Detail { get; set; }
    }

    public class PromotionUpdateDto
    {
        public string Title { get; set; }
        public string Promotion_Code { get; set; }
        public DateTime Start_Date { get; set; }
        public DateTime End_Date { get; set; }
        public string Discount_Type { get; set; }
        public decimal Discount_Value { get; set; }
        public decimal Minimum_Purchase { get; set; }
        public decimal? Maximum_Discount { get; set; }
        public string Applicable_For { get; set; }
        public int? Usage_Limit { get; set; }
        public string Status { get; set; }
        public string Promotion_Detail { get; set; }
    }

    public class ApplyPromotionDto
    {
        public int BookingId { get; set; }
        public string PromotionCode { get; set; }
    }

    public class PromotionValidationResult
    {
        public bool IsValid { get; set; }
        public string Message { get; set; }
        public int PromotionId { get; set; }
        public string PromotionCode { get; set; }
        public string Title { get; set; }
        public string DiscountType { get; set; }
        public decimal DiscountValue { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
        public DateTime ExpiresOn { get; set; }
    }

    public class PromotionApplicationResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int BookingId { get; set; }
        public int PromotionId { get; set; }
        public string PromotionCode { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal OriginalTotal { get; set; }
        public decimal NewTotal { get; set; }
    }

    public class PromotionRemovalResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public int BookingId { get; set; }
        public decimal NewTotal { get; set; }
    }
}

