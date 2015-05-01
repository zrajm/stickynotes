#!/usr/bin/perl

use 5.10.0;
use warnings;
use strict;

my $dir = "notes";

sub write_file {
    my ($file, $data) = @_;
    open my $out, ">", $file
        or die "Cannot open file '$file' for writing: $!\n";
    print $out $data;
    close $out
        or die "Cannot close file '$file' after writing: $!\n";
}

sub read_file {
    my ($file, $data) = @_;
    open my $in, ">", $file
        or die "Cannot open file '$file' for reading: $!\n";
    return join "", <$in>;
}

sub erase_file {
    my ($file) = @_;
    unlink $file or die "Cannot erase file '$file': $!\n";
}

################################################################################

my $method = $ENV{REQUEST_METHOD} // "";
my $id     = $ENV{QUERY_STRING}   // "";

if (not $method) {
    # Started from command line.
}

{
    open my $out, '>>index.log';
    say $out "METHOD: $method";
    say $out "ID(?):  $id";
    say $out "$_ = $ENV{$_}" foreach keys %ENV;
    say $out "-" x 80;
}


if (not $id =~ /^[a-z0-9]+$/) {
    die "bad sticky note ID '$id' (must be strictly alphanumerical)\n";
}


my $file = "$dir/$id";

for ($method) {
    /^GET$/ and do {
        say "Content-Type: application/json\n" . read_file($file);
        exit 0;
    };

    /^DELETE$/ and do {
        say "Content-Type: application/json\n";
        erase_file($file);
        exit 0;
    };

    /^PUT$/ and do {
        my $payload = join "", <STDIN>;
        write_file($file, $payload);
        say "Content-Type: application/JSON\n";
        exit 0;
    }
}

#[eof]
