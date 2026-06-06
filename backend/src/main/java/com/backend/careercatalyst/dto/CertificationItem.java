package com.backend.careercatalyst.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificationItem {

    private String name;
    private String issuer;
    private String date;
}